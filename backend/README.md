# Backend — AI Bot + Memory

FastAPI service that powers the chat and the five memory types.

## Memory types
- **Profile** — durable key/value facts about the user (SQLite)
- **Short-term** — rolling conversation buffer (SQLite)
- **Long-term** — semantic facts (ChromaDB, embedded)
- **Episodic** — timestamped event summaries (ChromaDB, embedded)
- **Node & Graph** — Obsidian-style markdown vault with `[[wikilinks]]` (`data/vault/`)

Memories are written **automatically**: after each turn the model extracts facts,
an episodic summary, and entity links, routing them to the right store.

## Setup
```bash
ollama pull nomic-embed-text          # embeddings for long-term/episodic
python -m venv .venv
.venv\Scripts\activate                # Windows
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

The model used for chat is whatever you select on the app's **Settings** page
(Ollama local or OpenRouter cloud); it is read from `data/settings.json`.

## Endpoints
- `POST /chat` — `{messages:[{role,content}]}` → streamed text
- `GET /memory/{profile|short_term|long_term|episodic}` — list
- `DELETE /memory/{kind}/{id}` — delete one
- `GET /graph` — `{nodes, edges}` from the vault
- `GET/PUT /settings` — read / persist persona, model, voice
- `GET /health`

All app data lives under `data/` (gitignored).
