"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputCls =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const areaCls =
  "w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Status = {
  running: boolean;
  connecting: boolean;
  user: string | null;
  error: string | null;
};

function parseList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CommunicationPage() {
  const [token, setToken] = useState("");
  const [presence, setPresence] = useState("");
  const [respondInDMs, setRespondInDMs] = useState(true);
  const [allowedGuilds, setAllowedGuilds] = useState("");
  const [allowedChannels, setAllowedChannels] = useState("");
  const [allowedUsers, setAllowedUsers] = useState("");
  const [blockedUsers, setBlockedUsers] = useState("");
  const [allowedRoles, setAllowedRoles] = useState("");

  const [status, setStatus] = useState<Status>({
    running: false,
    connecting: false,
    user: null,
    error: null,
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [busy, setBusy] = useState(false);

  // Load saved Discord settings.
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        const d = s.discord ?? {};
        setToken(d.token ?? "");
        setPresence(d.presence ?? "");
        setRespondInDMs(d.respondInDMs ?? true);
        setAllowedGuilds((d.allowedGuilds ?? []).join("\n"));
        setAllowedChannels((d.allowedChannels ?? []).join("\n"));
        setAllowedUsers((d.allowedUsers ?? []).join("\n"));
        setBlockedUsers((d.blockedUsers ?? []).join("\n"));
        setAllowedRoles((d.allowedRoles ?? []).join("\n"));
      })
      .catch(() => {});
  }, []);

  // Poll connection status.
  const refreshStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/discord/status");
      setStatus(await r.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const id = setInterval(refreshStatus, 4000);
    return () => clearInterval(id);
  }, [refreshStatus]);

  async function saveSettings() {
    setSaveState("saving");
    const discord = {
      token,
      presence,
      respondInDMs,
      allowedGuilds: parseList(allowedGuilds),
      allowedChannels: parseList(allowedChannels),
      allowedUsers: parseList(allowedUsers),
      blockedUsers: parseList(blockedUsers),
      allowedRoles: parseList(allowedRoles),
    };
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ discord }),
    });
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }

  async function connect() {
    setBusy(true);
    try {
      await saveSettings(); // persist token first
      await fetch("/api/discord/start", { method: "POST" });
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await fetch("/api/discord/stop", { method: "POST" });
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Communication</h1>
      <p className="text-sm text-muted-foreground">
        Settings for the bot&apos;s communication channels.
      </p>

      <section className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Discord</h2>
          <StatusBadge status={status} />
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            {status.running ? (
              <Button
                variant="destructive"
                onClick={disconnect}
                disabled={busy}
              >
                {busy ? "Working…" : "Disconnect"}
              </Button>
            ) : (
              <Button onClick={connect} disabled={busy || !token}>
                {busy ? "Connecting…" : "Connect"}
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              Connecting saves your settings first.
            </span>
          </div>

          {status.error && (
            <p className="rounded-md bg-red-500/10 p-2 text-xs text-red-500">
              {status.error}
            </p>
          )}

          <Field label="Bot token">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Discord bot token"
              autoComplete="off"
              className={inputCls}
            />
          </Field>

          <Field
            label="Presence / status text"
            hint="Optional 'Playing ...' text shown on the bot."
          >
            <input
              value={presence}
              onChange={(e) => setPresence(e.target.value)}
              placeholder="e.g. Listening for mentions"
              className={inputCls}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={respondInDMs}
              onChange={(e) => setRespondInDMs(e.target.checked)}
              className="h-4 w-4"
            />
            Respond to direct messages
          </label>

          <div className="rounded-md border border-border p-3">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Access control — who it can speak to
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              One ID per line. Leave a list empty to allow all (except the
              blocklist). The bot replies on @mention, replies to it, or DMs.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Allowed servers (guild IDs)">
                <textarea
                  rows={3}
                  value={allowedGuilds}
                  onChange={(e) => setAllowedGuilds(e.target.value)}
                  className={areaCls}
                />
              </Field>
              <Field label="Allowed channels (IDs)">
                <textarea
                  rows={3}
                  value={allowedChannels}
                  onChange={(e) => setAllowedChannels(e.target.value)}
                  className={areaCls}
                />
              </Field>
              <Field label="Allowed users (IDs)">
                <textarea
                  rows={3}
                  value={allowedUsers}
                  onChange={(e) => setAllowedUsers(e.target.value)}
                  className={areaCls}
                />
              </Field>
              <Field label="Blocked users (IDs)">
                <textarea
                  rows={3}
                  value={blockedUsers}
                  onChange={(e) => setBlockedUsers(e.target.value)}
                  className={areaCls}
                />
              </Field>
              <Field label="Allowed roles (IDs)">
                <textarea
                  rows={3}
                  value={allowedRoles}
                  onChange={(e) => setAllowedRoles(e.target.value)}
                  className={areaCls}
                />
              </Field>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Enable the <strong>Message Content Intent</strong> in the Discord
            Developer Portal, and invite the bot to your server. Token changes
            require a reconnect; access-control changes apply live after saving.
          </p>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={saveSettings}
              disabled={saveState === "saving"}
            >
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "Saved"
                  : "Save changes"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const { running, connecting, user } = status;
  const label = running
    ? `Connected${user ? ` as ${user}` : ""}`
    : connecting
      ? "Connecting…"
      : "Disconnected";
  const color = running
    ? "bg-emerald-500"
    : connecting
      ? "bg-amber-500"
      : "bg-muted-foreground";
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}
