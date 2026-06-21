"""Automatic memory extraction.

After each exchange, ask the model to pull out durable facts, an episodic
summary, and entity relationships, then route them to the right stores. Failures
are swallowed so memory extraction never breaks the chat itself.
"""

from __future__ import annotations

import json

from .. import llm
from . import episodic, graph_vault, longterm, profile

_SYSTEM = (
    "You extract long-lived memory from a conversation turn. "
    "Respond with ONLY a JSON object, no prose, no code fences. Schema:\n"
    "{\n"
    '  "profile": [{"key": "short_snake_case", "value": "fact about the USER"}],\n'
    '  "long_term": ["durable general facts worth remembering"],\n'
    '  "episodic": "one-sentence summary of what happened this turn",\n'
    '  "entities": ["proper nouns: people, projects, topics"],\n'
    '  "relations": [["EntityA", "EntityB"]]\n'
    "}\n"
    "Rules:\n"
    "- profile: capture identity facts about the USER such as their name, role, "
    "location, and stable preferences (e.g. key \"name\", value \"Travis\").\n"
    "- entities: write proper nouns EXACTLY as they appear, preserving the "
    "original capitalization and spacing (e.g. \"The Foundation\", not "
    "\"the_foundation\"). Do not snake_case entities or relations.\n"
    "- Use [] or \"\" when a section has nothing. Only include genuinely durable "
    "information; ignore small talk."
)


def _parse_json(text: str) -> dict:
    text = text.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return {}
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return {}


async def run(settings: dict, user_text: str, assistant_text: str) -> None:
    payload = (
        f"USER said:\n{user_text}\n\nASSISTANT replied:\n{assistant_text}"
    )
    try:
        raw = await llm.complete(
            settings,
            [
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": payload},
            ],
        )
    except Exception:
        return

    data = _parse_json(raw)
    if not data:
        return

    # Profile facts
    for fact in data.get("profile", []) or []:
        try:
            key, value = fact.get("key"), fact.get("value")
            if key and value:
                profile.upsert(str(key), str(value))
        except Exception:
            continue

    # Long-term facts
    for fact in data.get("long_term", []) or []:
        try:
            if isinstance(fact, str) and fact.strip():
                longterm.add(fact)
        except Exception:
            continue

    # Episodic summary
    summary = data.get("episodic")
    if isinstance(summary, str) and summary.strip():
        try:
            episodic.add(summary)
        except Exception:
            pass

    # Graph entities + relations
    entities = [e for e in (data.get("entities") or []) if isinstance(e, str)]
    relations = data.get("relations") or []
    try:
        for entity in entities:
            graph_vault.upsert_note(entity)
        for rel in relations:
            if isinstance(rel, (list, tuple)) and len(rel) == 2:
                a, b = str(rel[0]), str(rel[1])
                if a and b:
                    graph_vault.upsert_note(a, links=[b])
                    graph_vault.upsert_note(b)
    except Exception:
        pass
