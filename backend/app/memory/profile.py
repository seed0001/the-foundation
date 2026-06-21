"""Profile memory: durable key/value facts about the user."""

from __future__ import annotations

from . import store


def upsert(key: str, value: str) -> None:
    store.execute(
        """
        INSERT INTO profile (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = datetime('now')
        """,
        (key.strip(), value.strip()),
    )


def list_all() -> list[dict]:
    rows = store.query(
        "SELECT id, key, value FROM profile ORDER BY updated_at DESC"
    )
    return [
        {"id": str(r["id"]), "key": r["key"], "text": r["value"]} for r in rows
    ]


def delete(item_id: str) -> None:
    store.execute("DELETE FROM profile WHERE id = ?", (item_id,))


def clear() -> None:
    store.execute("DELETE FROM profile")


def as_context() -> str:
    facts = list_all()
    if not facts:
        return ""
    lines = [f"- {f['key']}: {f['text']}" for f in facts]
    return "Known facts about the user:\n" + "\n".join(lines)
