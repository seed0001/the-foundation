"""ChromaDB vector store with a local Ollama embedding function."""

from __future__ import annotations

import httpx

from ..config import CHROMA_DIR, EMBED_MODEL, OLLAMA_HOST, ensure_dirs

_client = None
_collections: dict = {}


class OllamaEmbeddingFunction:
    """Chroma-compatible embedding function backed by a local Ollama model."""

    def __init__(self, model: str = EMBED_MODEL, host: str = OLLAMA_HOST):
        self.model = model
        self.host = host.rstrip("/")

    # Chroma calls this to identify the EF; required in recent versions.
    def name(self) -> str:  # pragma: no cover - trivial
        return f"ollama:{self.model}"

    def __call__(self, input):  # noqa: A002 - name dictated by Chroma interface
        texts = list(input)
        out: list[list[float]] = []
        with httpx.Client(timeout=60.0) as client:
            for text in texts:
                resp = client.post(
                    f"{self.host}/api/embeddings",
                    json={"model": self.model, "prompt": text},
                )
                resp.raise_for_status()
                out.append(resp.json()["embedding"])
        return out


def _get_client():
    global _client
    if _client is None:
        ensure_dirs()
        import chromadb

        _client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    return _client


def get_collection(name: str):
    if name not in _collections:
        _collections[name] = _get_client().get_or_create_collection(
            name=name,
            embedding_function=OllamaEmbeddingFunction(),
        )
    return _collections[name]


def add(collection: str, doc_id: str, text: str, metadata: dict | None = None) -> None:
    get_collection(collection).add(
        ids=[doc_id],
        documents=[text],
        metadatas=[metadata or {}],
    )


def query_texts(collection: str, text: str, k: int) -> list[dict]:
    col = get_collection(collection)
    if col.count() == 0:
        return []
    res = col.query(query_texts=[text], n_results=min(k, col.count()))
    items: list[dict] = []
    ids = res.get("ids", [[]])[0]
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    for i, doc_id in enumerate(ids):
        items.append(
            {"id": doc_id, "text": docs[i], "metadata": metas[i] or {}}
        )
    return items


def list_all(collection: str) -> list[dict]:
    col = get_collection(collection)
    if col.count() == 0:
        return []
    res = col.get()
    items: list[dict] = []
    for i, doc_id in enumerate(res.get("ids", [])):
        items.append(
            {
                "id": doc_id,
                "text": res.get("documents", [])[i],
                "metadata": (res.get("metadatas", []) or [])[i] or {},
            }
        )
    return items


def delete(collection: str, doc_id: str) -> None:
    get_collection(collection).delete(ids=[doc_id])


def clear(collection: str) -> None:
    """Drop the whole collection; it is recreated lazily on next use."""
    try:
        _get_client().delete_collection(collection)
    except Exception:
        pass
    _collections.pop(collection, None)
