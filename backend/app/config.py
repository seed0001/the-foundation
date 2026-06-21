"""Paths, environment, and the persisted settings store."""

from __future__ import annotations

import json
import os
from pathlib import Path
from threading import Lock

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
VAULT_DIR = DATA_DIR / "vault"
CHROMA_DIR = DATA_DIR / "chroma"
VOICES_DIR = DATA_DIR / "voices"
ENGINES_DIR = BASE_DIR / "engines"
DB_PATH = DATA_DIR / "app.db"
SETTINGS_PATH = DATA_DIR / "settings.json"

# Environment-tunable knobs
EMBED_MODEL = os.environ.get("EMBED_MODEL", "nomic-embed-text")
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
RETRIEVE_K = int(os.environ.get("RETRIEVE_K", "5"))
SHORT_TERM_TURNS = int(os.environ.get("SHORT_TERM_TURNS", "10"))

# Single default conversation for now (multi-conversation is future work).
DEFAULT_CONVERSATION = "default"

_DEFAULT_SETTINGS: dict = {
    "persona": {
        "name": "Assistant",
        "statement": "",
    },
    "model": {
        "source": "local",  # "local" (Ollama) | "cloud" (OpenRouter)
        "id": "",
        "ollamaHost": OLLAMA_HOST,
        "openRouterKey": "",
    },
    "voice": {
        "source": "local",  # "local" (LuxTTS/XTTS) | "cloud"
        "engine": "xtts",  # local engine: "xtts" | "luxtts"
        "voice": "",  # selected reference clip filename (a cloned voice)
        "provider": "",  # cloud
        "key": "",  # cloud
        "name": "",  # cloud voice id/name
    },
    "discord": {
        "enabled": False,  # desired connection state (persists across restarts)
        "token": "",
        "respondInDMs": True,
        "presence": "",  # optional status/activity text
        "allowedGuilds": [],
        "allowedChannels": [],
        "allowedUsers": [],
        "blockedUsers": [],
        "allowedRoles": [],
    },
}

_settings_lock = Lock()


def ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    VAULT_DIR.mkdir(parents=True, exist_ok=True)
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    VOICES_DIR.mkdir(parents=True, exist_ok=True)


def _merge(base: dict, override: dict) -> dict:
    """Deep-merge override onto base (so new default keys survive upgrades)."""
    out = dict(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = _merge(out[key], value)
        else:
            out[key] = value
    return out


def load_settings() -> dict:
    if not SETTINGS_PATH.exists():
        return json.loads(json.dumps(_DEFAULT_SETTINGS))
    try:
        stored = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return json.loads(json.dumps(_DEFAULT_SETTINGS))
    return _merge(_DEFAULT_SETTINGS, stored)


def save_settings(settings: dict) -> dict:
    ensure_dirs()
    merged = _merge(load_settings(), settings)
    with _settings_lock:
        SETTINGS_PATH.write_text(
            json.dumps(merged, indent=2), encoding="utf-8"
        )
    return merged


def reset_settings() -> dict:
    """Restore settings to factory defaults."""
    ensure_dirs()
    defaults = json.loads(json.dumps(_DEFAULT_SETTINGS))
    with _settings_lock:
        SETTINGS_PATH.write_text(
            json.dumps(defaults, indent=2), encoding="utf-8"
        )
    return defaults
