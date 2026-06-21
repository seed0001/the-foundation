"""Chat endpoint: retrieve memory -> generate (stream) -> extract memory."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from starlette.background import BackgroundTask

from .. import llm
from ..agent import build_system_prompt
from ..config import load_settings
from ..memory import extractor, shortterm
from ..schemas import ChatRequest

router = APIRouter()


@router.post("/chat")
async def chat(req: ChatRequest):
    settings = load_settings()
    messages = [m.model_dump() for m in req.messages]

    last_user = ""
    for m in reversed(messages):
        if m["role"] == "user":
            last_user = m["content"]
            break

    if last_user:
        shortterm.append("user", last_user)

    system_prompt = build_system_prompt(settings, last_user)
    llm_messages = [{"role": "system", "content": system_prompt}] + messages

    collected: list[str] = []

    async def generate():
        try:
            async for chunk in llm.stream_chat(settings, llm_messages):
                collected.append(chunk)
                yield chunk
        except llm.LLMError as exc:
            yield f"\n[error] {exc}"

    async def finalize():
        text = "".join(collected).strip()
        if text:
            shortterm.append("assistant", text)
            await extractor.run(settings, last_user, text)

    return StreamingResponse(
        generate(),
        media_type="text/plain; charset=utf-8",
        background=BackgroundTask(finalize),
    )
