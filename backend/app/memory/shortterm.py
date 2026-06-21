"""Short-term memory: the rolling conversation buffer."""

from __future__ import annotations

from ..config import DEFAULT_CONVERSATION, SHORT_TERM_TURNS
from . import store


def append(role: str, content: str, conversation: str = DEFAULT_CONVERSATION) -> None:
    store.execute(
        "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
        (conversation, role, content),
    )


def recent(
    limit: int = SHORT_TERM_TURNS, conversation: str = DEFAULT_CONVERSATION
) -> list[dict]:
    rows = store.query(
        """
        SELECT id, role, content FROM messages
        WHERE conversation_id = ?
        ORDER BY id DESC LIMIT ?
        """,
        (conversation, limit),
    )
    rows = list(reversed(rows))
    return [
        {"id": str(r["id"]), "role": r["role"], "text": r["content"]}
        for r in rows
    ]


def list_all(conversation: str = DEFAULT_CONVERSATION) -> list[dict]:
    rows = store.query(
        """
        SELECT id, role, content FROM messages
        WHERE conversation_id = ?
        ORDER BY id DESC
        """,
        (conversation,),
    )
    return [
        {"id": str(r["id"]), "role": r["role"], "text": r["content"]}
        for r in rows
    ]


def delete(item_id: str) -> None:
    store.execute("DELETE FROM messages WHERE id = ?", (item_id,))


def clear() -> None:
    store.execute("DELETE FROM messages")
