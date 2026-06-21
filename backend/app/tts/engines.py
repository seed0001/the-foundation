"""Local TTS engines: XTTS (Coqui) and LuxTTS, both with voice cloning.

The heavy ML libraries (torch, coqui-tts, LuxTTS) are imported lazily and the
loaded models are cached, so:
  * the API server runs fine even when the engines are not installed, and
  * the first synthesis pays the load cost, later calls are fast.

If an engine is not installed, EngineNotInstalled is raised with guidance to run
the TTS setup script.
"""

from __future__ import annotations

import io
import os
import sys
import tempfile
import threading
from pathlib import Path

from ..config import ENGINES_DIR, VOICES_DIR

_models: dict = {}
_load_lock = threading.Lock()


class EngineNotInstalled(RuntimeError):
    pass


class TTSError(RuntimeError):
    pass


def reference_path(filename: str) -> Path:
    return VOICES_DIR / filename


def _device() -> str:
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            return "mps"
    except Exception:
        pass
    return "cpu"


# --- XTTS (Coqui) ----------------------------------------------------------
def _load_xtts():
    if "xtts" in _models:
        return _models["xtts"]
    with _load_lock:
        if "xtts" in _models:
            return _models["xtts"]
        try:
            from TTS.api import TTS
        except Exception as exc:
            raise EngineNotInstalled(
                "XTTS (coqui-tts) is not installed. Run backend/setup_tts.bat."
            ) from exc
        model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(_device())
        _models["xtts"] = model
        return model


def _synth_xtts(text: str, ref: Path) -> bytes:
    model = _load_xtts()
    out = tempfile.mktemp(suffix=".wav")
    try:
        model.tts_to_file(
            text=text,
            speaker_wav=str(ref),
            language="en",
            file_path=out,
        )
        return Path(out).read_bytes()
    finally:
        if os.path.exists(out):
            os.remove(out)


# --- LuxTTS ----------------------------------------------------------------
def _load_lux():
    if "luxtts" in _models:
        return _models["luxtts"]
    with _load_lock:
        if "luxtts" in _models:
            return _models["luxtts"]
        lux_dir = ENGINES_DIR / "LuxTTS"
        if lux_dir.exists() and str(lux_dir) not in sys.path:
            sys.path.insert(0, str(lux_dir))
        try:
            from zipvoice.luxvoice import LuxTTS
        except Exception as exc:
            raise EngineNotInstalled(
                "LuxTTS is not installed. Run backend/setup_tts.bat."
            ) from exc
        device = _device()
        if device == "cpu":
            model = LuxTTS("YatharthS/LuxTTS", device="cpu", threads=2)
        else:
            model = LuxTTS("YatharthS/LuxTTS", device=device)
        _models["luxtts"] = model
        return model


def _synth_lux(text: str, ref: Path) -> bytes:
    model = _load_lux()
    try:
        import soundfile as sf
    except Exception as exc:
        raise EngineNotInstalled(
            "soundfile is not installed. Run backend/setup_tts.bat."
        ) from exc
    encoded = model.encode_prompt(str(ref), rms=0.01)
    wav = model.generate_speech(text, encoded, num_steps=4)
    audio = wav.numpy().squeeze()
    buf = io.BytesIO()
    sf.write(buf, audio, 48000, format="WAV")
    return buf.getvalue()


# --- Public API ------------------------------------------------------------
def synthesize(engine: str, text: str, voice_filename: str) -> bytes:
    text = (text or "").strip()
    if not text:
        raise TTSError("No text to synthesize.")

    ref = reference_path(voice_filename)
    if not ref.exists():
        raise TTSError(f"Reference voice '{voice_filename}' not found.")

    if engine == "xtts":
        return _synth_xtts(text, ref)
    if engine == "luxtts":
        return _synth_lux(text, ref)
    raise TTSError(f"Unknown TTS engine: {engine}")
