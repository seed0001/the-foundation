"""Shared agent orchestration used by both the web chat and the Discord bot.

One brain: persona + memory retrieval, generation, and memory extraction. The
web route streams via build_system_prompt(); other channels (Discord) call
respond() for a full-text reply.
"""

from __future__ import annotations

import re

from . import llm
from .config import load_settings
from .memory import episodic, extractor, longterm, profile, shortterm

_TAG_RE = re.compile(r"<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\/?>")


def strip_html(text: str) -> str:
    """Remove stray HTML tags some models leak, preserving ``` code blocks."""
    parts = re.split(r"(```.*?```)", text, flags=re.S)
    return "".join(
        p if i % 2 == 1 else _TAG_RE.sub("", p) for i, p in enumerate(parts)
    )


def build_system_prompt(settings: dict, last_user: str) -> str:
    persona = settings.get("persona", {})
    parts: list[str] = []

    statement = (persona.get("statement") or "").strip()
    name = (persona.get("name") or "Assistant").strip()
    parts.append(statement or f"You are {name}.")

    prof = profile.as_context()
    if prof:
        parts.append(prof)

    if last_user:
        try:
            lt = longterm.retrieve(last_user)
            if lt:
                parts.append(
                    "Relevant long-term memory:\n"
                    + "\n".join(f"- {i['text']}" for i in lt)
                )
        except Exception:
            pass
        try:
            ep = episodic.retrieve(last_user)
            if ep:
                parts.append(
                    "Relevant past episodes:\n"
                    + "\n".join(f"- {i['text']}" for i in ep)
                )
        except Exception:
            pass

    return "\n\n".join(parts)


async def respond(user_text: str) -> str:
    """Full (non-streaming) reply for non-web channels. Shares memory."""
    user_text = (user_text or "").strip()
    if not user_text:
        return ""

    settings = load_settings()
    shortterm.append("user", user_text)

    system_prompt = build_system_prompt(settings, user_text)
    history = [
        {"role": m["role"], "content": m["text"]} for m in shortterm.recent()
    ]
    messages = [{"role": "system", "content": system_prompt}] + history

    try:
        reply = await llm.complete(settings, messages)
    except llm.LLMError as exc:
        return f"[error] {exc}"

    reply = strip_html(reply).strip()
    if reply:
        shortterm.append("assistant", reply)
        await extractor.run(settings, user_text, reply)
    return reply
