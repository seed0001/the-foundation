"""LLM client: streaming + non-streaming chat for Ollama and OpenRouter.

The provider, model id, host, and key all come from the persisted settings, so
switching local/cloud in the UI changes which backend this talks to.
"""

from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class LLMError(RuntimeError):
    pass


def _resolve(settings: dict) -> dict:
    model = settings.get("model", {})
    source = model.get("source", "local")
    model_id = (model.get("id") or "").strip()
    if not model_id:
        raise LLMError(
            "No model selected. Choose a model on the Settings page first."
        )
    return {
        "source": source,
        "id": model_id,
        "host": (model.get("ollamaHost") or "http://localhost:11434").rstrip("/"),
        "key": model.get("openRouterKey") or "",
    }


def _payload_messages(messages: list[dict]) -> list[dict]:
    return [{"role": m["role"], "content": m["content"]} for m in messages]


async def stream_chat(settings: dict, messages: list[dict]) -> AsyncIterator[str]:
    cfg = _resolve(settings)
    if cfg["source"] == "local":
        async for chunk in _ollama_stream(cfg, messages):
            yield chunk
    else:
        async for chunk in _openrouter_stream(cfg, messages):
            yield chunk


async def complete(settings: dict, messages: list[dict]) -> str:
    """Non-streaming completion (used by the extractor)."""
    parts: list[str] = []
    async for chunk in stream_chat(settings, messages):
        parts.append(chunk)
    return "".join(parts)


async def _ollama_stream(cfg: dict, messages: list[dict]) -> AsyncIterator[str]:
    body = {
        "model": cfg["id"],
        "messages": _payload_messages(messages),
        "stream": True,
    }
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST", f"{cfg['host']}/api/chat", json=body
        ) as resp:
            if resp.status_code != 200:
                detail = (await resp.aread()).decode("utf-8", "ignore")
                raise LLMError(f"Ollama error {resp.status_code}: {detail}")
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue
                piece = (data.get("message") or {}).get("content")
                if piece:
                    yield piece


async def _openrouter_stream(cfg: dict, messages: list[dict]) -> AsyncIterator[str]:
    if not cfg["key"]:
        raise LLMError("OpenRouter API key is not set on the Settings page.")
    body = {
        "model": cfg["id"],
        "messages": _payload_messages(messages),
        "stream": True,
    }
    headers = {"Authorization": f"Bearer {cfg['key']}"}
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST", OPENROUTER_URL, json=body, headers=headers
        ) as resp:
            if resp.status_code != 200:
                detail = (await resp.aread()).decode("utf-8", "ignore")
                raise LLMError(f"OpenRouter error {resp.status_code}: {detail}")
            async for line in resp.aiter_lines():
                line = line.strip()
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if not data or data == "[DONE]":
                    continue
                try:
                    event = json.loads(data)
                except json.JSONDecodeError:
                    continue
                choices = event.get("choices") or []
                if not choices:
                    continue
                piece = (choices[0].get("delta") or {}).get("content")
                if piece:
                    yield piece
