"""Node & Graph memory: an Obsidian-style markdown vault with [[wikilinks]]."""

from __future__ import annotations

import re
from datetime import datetime, timezone

import frontmatter

from ..config import VAULT_DIR, ensure_dirs

_INVALID = re.compile(r'[\\/:*?"<>|]')
_WIKILINK = re.compile(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]")


def _safe_filename(title: str) -> str:
    return _INVALID.sub("", title).strip() or "untitled"


def _path_for(title: str):
    return VAULT_DIR / f"{_safe_filename(title)}.md"


def upsert_note(
    title: str, note: str | None = None, links: list[str] | None = None
) -> None:
    """Create or update a note; append a dated bullet and ensure [[links]]."""
    ensure_dirs()
    path = _path_for(title)
    links = links or []

    if path.exists():
        post = frontmatter.load(path)
    else:
        post = frontmatter.Post("")
        post["title"] = title
        post["created"] = datetime.now(timezone.utc).isoformat()

    body = post.content.rstrip()

    if note:
        stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        bullet = f"- ({stamp}) {note.strip()}"
        if note.strip() not in body:
            body = f"{body}\n{bullet}" if body else bullet

    existing_links = set(_WIKILINK.findall(body))
    for link in links:
        link = link.strip()
        if link and link != title and link not in existing_links:
            body = f"{body}\n- Related: [[{link}]]"
            existing_links.add(link)

    post.content = body.strip() + "\n"
    path.write_text(frontmatter.dumps(post), encoding="utf-8")


def list_notes() -> list[dict]:
    ensure_dirs()
    notes = []
    for path in sorted(VAULT_DIR.glob("*.md")):
        notes.append({"id": path.stem, "text": path.stem})
    return notes


def delete_note(title: str) -> None:
    path = _path_for(title)
    if path.exists():
        path.unlink()


def clear() -> None:
    """Delete every note in the vault."""
    ensure_dirs()
    for path in VAULT_DIR.glob("*.md"):
        try:
            path.unlink()
        except OSError:
            continue


def build_graph() -> dict:
    """Parse every note's [[links]] into nodes and edges."""
    ensure_dirs()
    nodes: dict[str, str] = {}
    edges: list[dict] = []

    files = list(VAULT_DIR.glob("*.md"))
    for path in files:
        source = path.stem
        nodes.setdefault(source, source)
        try:
            content = path.read_text(encoding="utf-8")
        except OSError:
            continue
        for target in _WIKILINK.findall(content):
            target = target.strip()
            if not target:
                continue
            nodes.setdefault(target, target)  # include unresolved links
            edges.append({"source": source, "target": target})

    return {
        "nodes": [{"id": n, "label": label} for n, label in nodes.items()],
        "edges": edges,
    }
