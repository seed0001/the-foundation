"""Settings endpoints: read and persist persona / model / voice config."""

from __future__ import annotations

from fastapi import APIRouter, Request

from ..config import load_settings, reset_settings, save_settings
from ..memory import maintenance

router = APIRouter()


@router.post("/settings/reset")
def factory_reset():
    """Factory reset: settings back to defaults AND wipe all memory."""
    defaults = reset_settings()
    maintenance.clear_all()
    return defaults


@router.get("/settings")
def get_settings():
    return load_settings()


@router.put("/settings")
async def put_settings(request: Request):
    body = await request.json()
    return save_settings(body)
