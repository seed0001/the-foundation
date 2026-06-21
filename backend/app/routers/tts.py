"""TTS synthesis and the reference-voice ("cloned voice") library."""

from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool

from ..config import VOICES_DIR, ensure_dirs, load_settings
from ..schemas import TTSRequest
from ..tts import engines

router = APIRouter()

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")
_ALLOWED_EXT = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}


@router.get("/voices")
def list_voices():
    ensure_dirs()
    items = [
        {"id": p.name, "text": p.name}
        for p in sorted(VOICES_DIR.glob("*"))
        if p.is_file()
    ]
    return {"items": items}


@router.post("/voices")
async def upload_voice(file: UploadFile):
    ensure_dirs()
    name = _SAFE.sub("_", (file.filename or "voice").strip())
    ext = "." + name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in _ALLOWED_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio type '{ext}'. Use wav/mp3/flac/ogg/m4a.",
        )
    dest = VOICES_DIR / name
    dest.write_bytes(await file.read())
    return {"ok": True, "name": name}


@router.delete("/voices/{name}")
def delete_voice(name: str):
    path = VOICES_DIR / _SAFE.sub("_", name)
    if path.exists():
        path.unlink()
    return {"ok": True}


@router.post("/tts")
async def synthesize(req: TTSRequest):
    settings = load_settings()
    voice_cfg = settings.get("voice", {})

    if voice_cfg.get("source") != "local":
        raise HTTPException(
            status_code=400,
            detail="Only local TTS (LuxTTS/XTTS) is implemented.",
        )

    engine = req.engine or voice_cfg.get("engine", "xtts")
    voice = req.voice or voice_cfg.get("voice", "")
    if not voice:
        raise HTTPException(
            status_code=400, detail="No reference voice selected."
        )

    try:
        audio = await run_in_threadpool(
            engines.synthesize, engine, req.text, voice
        )
    except engines.EngineNotInstalled as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except engines.TTSError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return Response(content=audio, media_type="audio/wav")
