"""FastAPI application entrypoint for the AI bot + memory system."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import ensure_dirs, load_settings
from .discordbot.manager import manager
from .routers import chat, comms, graph, memory, settings, tts

app = FastAPI(title="The Foundation — AI Bot")

# The Next.js app proxies server-side, but allow localhost origins too so the
# backend can be hit directly during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup() -> None:
    ensure_dirs()
    # Auto-reconnect the Discord bot if it was left enabled.
    cfg = load_settings().get("discord") or {}
    if cfg.get("enabled") and cfg.get("token"):
        try:
            await manager.start(cfg["token"])
        except Exception:
            pass


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(chat.router)
app.include_router(memory.router)
app.include_router(graph.router)
app.include_router(settings.router)
app.include_router(tts.router)
app.include_router(comms.router)
