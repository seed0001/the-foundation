"""Long-term memory: durable semantic facts, stored as embedded documents."""

from __future__ import annotations

import uuid

from ..config import RETRIEVE_K
from . import vectors

COLLECTION = "long_term"


def add(text: str) -> str:
    doc_id = uuid.uuid4().hex
    vectors.add(COLLECTION, doc_id, text.strip())
    return doc_id


def retrieve(query: str, k: int = RETRIEVE_K) -> list[dict]:
    return vectors.query_texts(COLLECTION, query, k)


def list_all() -> list[dict]:
    return vectors.list_all(COLLECTION)


def delete(item_id: str) -> None:
    vectors.delete(COLLECTION, item_id)


def clear() -> None:
    vectors.clear(COLLECTION)
