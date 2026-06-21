"""Communication channels — runtime control for the Discord bot."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..config import load_settings, save_settings
from ..discordbot.manager import manager

router = APIRouter()


@router.get("/discord/status")
def discord_status():
    return manager.status()


@router.post("/discord/start")
async def discord_start():
    cfg = load_settings().get("discord") or {}
    token = cfg.get("token") or ""
    if not token:
        raise HTTPException(status_code=400, detail="No Discord bot token saved.")
    try:
        await manager.start(token)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    save_settings({"discord": {"enabled": True}})
    return manager.status()


@router.post("/discord/stop")
async def discord_stop():
    await manager.stop()
    save_settings({"discord": {"enabled": False}})
    return manager.status()
