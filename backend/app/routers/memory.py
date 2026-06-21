"""Memory CRUD for the Memory page: profile, short-term, long-term, episodic."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..memory import episodic, longterm, maintenance, profile, shortterm

router = APIRouter()


@router.post("/memory/reset")
def reset_memory():
    """Wipe every memory container (profile, short/long-term, episodic, graph)."""
    maintenance.clear_all()
    return {"ok": True}

_LISTERS = {
    "profile": profile.list_all,
    "short_term": shortterm.list_all,
    "long_term": longterm.list_all,
    "episodic": episodic.list_all,
}

_DELETERS = {
    "profile": profile.delete,
    "short_term": shortterm.delete,
    "long_term": longterm.delete,
    "episodic": episodic.delete,
}


@router.get("/memory/{kind}")
def list_memory(kind: str):
    if kind not in _LISTERS:
        raise HTTPException(status_code=404, detail=f"Unknown memory type: {kind}")
    try:
        return {"items": _LISTERS[kind]()}
    except Exception as exc:  # e.g. embedding model not pulled yet
        return {"items": [], "error": str(exc)}


@router.delete("/memory/{kind}/{item_id}")
def delete_memory(kind: str, item_id: str):
    if kind not in _DELETERS:
        raise HTTPException(status_code=404, detail=f"Unknown memory type: {kind}")
    _DELETERS[kind](item_id)
    return {"ok": True}
