"""Episodic memory: time-stamped event summaries of exchanges."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from ..config import RETRIEVE_K
from . import vectors

COLLECTION = "episodic"


def add(summary: str) -> str:
    doc_id = uuid.uuid4().hex
    ts = datetime.now(timezone.utc).isoformat()
    vectors.add(COLLECTION, doc_id, summary.strip(), {"timestamp": ts})
    return doc_id


def retrieve(query: str, k: int = RETRIEVE_K) -> list[dict]:
    return vectors.query_texts(COLLECTION, query, k)


def list_all() -> list[dict]:
    items = vectors.list_all(COLLECTION)
    # Newest first when timestamps are present.
    items.sort(key=lambda i: i.get("metadata", {}).get("timestamp", ""), reverse=True)
    return items


def delete(item_id: str) -> None:
    vectors.delete(COLLECTION, item_id)


def clear() -> None:
    vectors.clear(COLLECTION)
