"""Bulk maintenance: wipe every memory container at once."""

from __future__ import annotations

from . import episodic, graph_vault, longterm, profile, shortterm


def clear_all() -> None:
    profile.clear()
    shortterm.clear()
    longterm.clear()
    episodic.clear()
    graph_vault.clear()
