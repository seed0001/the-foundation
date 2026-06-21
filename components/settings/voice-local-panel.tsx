"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Upload, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputCls =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const engines = [
  { id: "xtts", label: "XTTS" },
  { id: "luxtts", label: "LuxTTS" },
];

export function VoiceLocalPanel({
  engine,
  onEngineChange,
  voice,
  onVoiceChange,
}: {
  engine: string;
  onEngineChange: (v: string) => void;
  voice: string;
  onVoiceChange: (v: string) => void;
}) {
  const [voices, setVoices] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadVoices = useCallback(async () => {
    try {
      const res = await fetch("/api/voices");
      const data = await res.json();
      setVoices((data.items ?? []).map((i: { id: string }) => i.id));
    } catch {
      setVoices([]);
    }
  }, []);

  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  async function upload(file: File) {
    setBusy(true);
    setStatus("Uploading…");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/voices", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      await loadVoices();
      onVoiceChange(data.name);
      setStatus("Uploaded.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeVoice() {
    if (!voice) return;
    setBusy(true);
    try {
      await fetch(`/api/voices?name=${encodeURIComponent(voice)}`, {
        method: "DELETE",
      });
      onVoiceChange("");
      await loadVoices();
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    if (!voice) {
      setStatus("Select a voice first.");
      return;
    }
    setBusy(true);
    setStatus("Synthesizing…");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: "This is a test of the selected voice.",
          engine,
          voice,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Synthesis failed");
      }
      const blob = await res.blob();
      new Audio(URL.createObjectURL(blob)).play();
      setStatus(null);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Synthesis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Engine</span>
        <div className="grid grid-cols-2 gap-2">
          {engines.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onEngineChange(e.id)}
              className={cn(
                "h-10 rounded-md border text-sm font-medium transition-colors",
                engine === e.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {e.label}
            </button>
          ))}
        </div>
      </label>

      <label className="block space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Cloned voice</span>
          <button
            type="button"
            onClick={loadVoices}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
        <select
          value={voice}
          onChange={(e) => onVoiceChange(e.target.value)}
          className={inputCls}
        >
          <option value="">
            {voices.length ? "Select a voice" : "No voices imported"}
          </option>
          {voices.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          <Upload className="h-4 w-4" />
          Import voice
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={test}
          disabled={busy || !voice}
        >
          <Play className="h-4 w-4" />
          Test
        </Button>
        {voice && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeVoice}
            disabled={busy}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Import a clean reference clip (3+ seconds) to clone a voice. XTTS and
        LuxTTS both run locally and require the TTS setup (backend/setup_tts.bat).
      </p>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}
