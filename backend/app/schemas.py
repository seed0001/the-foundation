"""Pydantic request/response models."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class MemoryItem(BaseModel):
    id: str
    text: str
    # Optional extras depending on the store (key, timestamp, role, etc.)
    key: Optional[str] = None
    timestamp: Optional[str] = None
    role: Optional[str] = None


class GraphNode(BaseModel):
    id: str
    label: str


class GraphEdge(BaseModel):
    source: str
    target: str


class Graph(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class Persona(BaseModel):
    name: str = "Assistant"
    statement: str = ""


class ModelSettings(BaseModel):
    source: Literal["local", "cloud"] = "local"
    id: str = ""
    ollamaHost: str = "http://localhost:11434"
    openRouterKey: str = ""


class VoiceSettings(BaseModel):
    source: Literal["local", "cloud"] = "local"
    engine: Literal["xtts", "luxtts"] = "xtts"
    voice: str = ""
    provider: str = ""
    key: str = ""
    name: str = ""


class TTSRequest(BaseModel):
    text: str
    # Optional overrides (e.g. for the Settings "Test" button); fall back to
    # the saved voice settings when omitted.
    engine: Optional[str] = None
    voice: Optional[str] = None


class DiscordSettings(BaseModel):
    enabled: bool = False
    token: str = ""
    respondInDMs: bool = True
    presence: str = ""
    allowedGuilds: list[str] = []
    allowedChannels: list[str] = []
    allowedUsers: list[str] = []
    blockedUsers: list[str] = []
    allowedRoles: list[str] = []


class Settings(BaseModel):
    persona: Persona = Persona()
    model: ModelSettings = ModelSettings()
    voice: VoiceSettings = VoiceSettings()
    discord: DiscordSettings = DiscordSettings()
