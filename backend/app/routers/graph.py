"""Node & Graph endpoints backed by the markdown vault."""

from __future__ import annotations

from fastapi import APIRouter

from ..memory import graph_vault

router = APIRouter()


@router.get("/graph")
def get_graph():
    return graph_vault.build_graph()


@router.get("/graph/notes")
def list_notes():
    return {"items": graph_vault.list_notes()}


@router.delete("/graph/notes/{title}")
def delete_note(title: str):
    graph_vault.delete_note(title)
    return {"ok": True}
