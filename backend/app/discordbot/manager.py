"""Runtime-controllable Discord bot that shares the AI + memory pipeline.

Runs as an asyncio task inside the FastAPI event loop, so it can be turned on
and off without a separate process. Access-control and trigger settings are read
from saved settings on every message, so they apply live; only the token change
requires a reconnect.
"""

from __future__ import annotations

import asyncio
import re

from ..agent import respond
from ..config import load_settings

_MENTION_RE = re.compile(r"<@!?\d+>")
_DISCORD_LIMIT = 2000


class DiscordManager:
    def __init__(self) -> None:
        self._client = None
        self._task: asyncio.Task | None = None
        self._error: str | None = None

    # --- lifecycle ---------------------------------------------------------
    async def start(self, token: str) -> None:
        if self.is_running():
            return
        if not token:
            raise ValueError("No Discord bot token configured.")

        import discord

        self._error = None
        intents = discord.Intents.default()
        intents.message_content = True
        client = discord.Client(intents=intents)
        self._client = client

        @client.event
        async def on_ready():  # noqa: D401
            presence = (load_settings().get("discord") or {}).get("presence")
            if presence:
                try:
                    await client.change_presence(
                        activity=discord.Game(name=presence)
                    )
                except Exception:
                    pass

        @client.event
        async def on_message(message):
            await self._handle_message(client, message)

        async def runner():
            try:
                await client.start(token)
            except Exception as exc:  # invalid token, network, etc.
                self._error = str(exc)

        self._task = asyncio.create_task(runner())

    async def stop(self) -> None:
        if self._client is not None:
            try:
                await self._client.close()
            except Exception:
                pass
        if self._task is not None:
            self._task.cancel()
        self._client = None
        self._task = None

    # --- status ------------------------------------------------------------
    def is_running(self) -> bool:
        return self._client is not None and self._client.is_ready()

    def status(self) -> dict:
        user = None
        if self._client is not None and self._client.user is not None:
            user = str(self._client.user)
        connecting = (
            self._task is not None
            and not self._task.done()
            and not self.is_running()
        )
        return {
            "running": self.is_running(),
            "connecting": connecting,
            "user": user,
            "error": self._error,
        }

    # --- message handling --------------------------------------------------
    async def _handle_message(self, client, message) -> None:
        if message.author.bot:
            return

        cfg = load_settings().get("discord") or {}

        import discord

        is_dm = isinstance(message.channel, discord.DMChannel)

        if not self._passes_access(cfg, message, is_dm):
            return
        if not self._passes_trigger(client, cfg, message, is_dm):
            return

        content = _MENTION_RE.sub("", message.content or "").strip()
        if not content:
            return

        try:
            async with message.channel.typing():
                reply = await respond(content)
        except Exception as exc:
            reply = f"[error] {exc}"

        for chunk in _chunk(reply, _DISCORD_LIMIT):
            await message.channel.send(chunk)

    @staticmethod
    def _passes_access(cfg: dict, message, is_dm: bool) -> bool:
        author_id = str(message.author.id)
        if author_id in set(cfg.get("blockedUsers") or []):
            return False

        allowed_users = set(cfg.get("allowedUsers") or [])
        if allowed_users and author_id not in allowed_users:
            return False

        if is_dm:
            return bool(cfg.get("respondInDMs", True))

        guilds = set(cfg.get("allowedGuilds") or [])
        if guilds and str(getattr(message.guild, "id", "")) not in guilds:
            return False

        channels = set(cfg.get("allowedChannels") or [])
        if channels and str(message.channel.id) not in channels:
            return False

        roles = set(cfg.get("allowedRoles") or [])
        if roles:
            author_roles = {
                str(r.id) for r in getattr(message.author, "roles", [])
            }
            if not (author_roles & roles):
                return False

        return True

    @staticmethod
    def _passes_trigger(client, cfg: dict, message, is_dm: bool) -> bool:
        if is_dm:
            return True
        if client.user in message.mentions:
            return True
        ref = getattr(message, "reference", None)
        resolved = getattr(ref, "resolved", None) if ref else None
        if resolved is not None and getattr(resolved, "author", None) == client.user:
            return True
        return False


def _chunk(text: str, size: int):
    text = text or ""
    if not text:
        return ["(no response)"]
    return [text[i : i + size] for i in range(0, len(text), size)]


# Module-level singleton
manager = DiscordManager()
