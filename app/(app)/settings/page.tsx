"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OllamaPanel } from "@/components/settings/ollama-panel";
import { OpenRouterPanel } from "@/components/settings/openrouter-panel";
import { VoiceLocalPanel } from "@/components/settings/voice-local-panel";

const inputCls =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function SettingsPage() {
  const [personaName, setPersonaName] = useState("");
  const [persona, setPersona] = useState("");
  const [model, setModel] = useState("");
  const [modelSource, setModelSource] = useState<"local" | "cloud">("local");
  const [ollamaHost, setOllamaHost] = useState("http://localhost:11434");
  const [openRouterKey, setOpenRouterKey] = useState("");

  const [voiceSource, setVoiceSource] = useState<"local" | "cloud">("local");
  const [voiceEngine, setVoiceEngine] = useState("xtts");
  const [voiceRef, setVoiceRef] = useState("");
  const [voiceProvider, setVoiceProvider] = useState("");
  const [voiceKey, setVoiceKey] = useState("");
  const [voiceName, setVoiceName] = useState("");

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  // Load persisted settings on mount.
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setPersonaName(s.persona?.name ?? "");
        setPersona(s.persona?.statement ?? "");
        setModel(s.model?.id ?? "");
        setModelSource(s.model?.source ?? "local");
        setOllamaHost(s.model?.ollamaHost ?? "http://localhost:11434");
        setOpenRouterKey(s.model?.openRouterKey ?? "");
        setVoiceSource(s.voice?.source ?? "local");
        setVoiceEngine(s.voice?.engine ?? "xtts");
        setVoiceRef(s.voice?.voice ?? "");
        setVoiceProvider(s.voice?.provider ?? "");
        setVoiceKey(s.voice?.key ?? "");
        setVoiceName(s.voice?.name ?? "");
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaveState("saving");
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          persona: { name: personaName, statement: persona },
          model: {
            source: modelSource,
            id: model,
            ollamaHost,
            openRouterKey,
          },
          voice: {
            source: voiceSource,
            engine: voiceEngine,
            voice: voiceRef,
            provider: voiceProvider,
            key: voiceKey,
            name: voiceName,
          },
        }),
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  }

  const [resetting, setResetting] = useState(false);

  async function factoryReset() {
    if (
      !window.confirm(
        "Reset to factory defaults? This restores all settings AND permanently wipes every memory (profile, short-term, long-term, episodic, graph). This cannot be undone.",
      )
    ) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/settings/reset", { method: "POST" });
      const s = await res.json();
      setPersonaName(s.persona?.name ?? "");
      setPersona(s.persona?.statement ?? "");
      setModel(s.model?.id ?? "");
      setModelSource(s.model?.source ?? "local");
      setOllamaHost(s.model?.ollamaHost ?? "http://localhost:11434");
      setOpenRouterKey(s.model?.openRouterKey ?? "");
      setVoiceSource(s.voice?.source ?? "local");
      setVoiceEngine(s.voice?.engine ?? "xtts");
      setVoiceRef(s.voice?.voice ?? "");
      setVoiceProvider(s.voice?.provider ?? "");
      setVoiceKey(s.voice?.key ?? "");
      setVoiceName(s.voice?.name ?? "");
    } catch {
      // ignore
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
      <Section
        title="Persona"
        description="Who the AI is and how it acts."
      >
        <Field label="Name">
          <input
            value={personaName}
            onChange={(e) => setPersonaName(e.target.value)}
            placeholder="e.g. Assistant"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Field>

        <Field
          label="Persona statement"
          hint="How the agent behaves, its tone, and its role."
        >
          <textarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            rows={6}
            placeholder="You are…"
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Field>
      </Section>

      <Section
        title="Model"
        description="Which model the AI runs on."
      >
        <Field label="Source">
          <div className="grid grid-cols-2 gap-2">
            {(["local", "cloud"] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => {
                  setModelSource(src);
                  setModel("");
                }}
                className={cn(
                  "h-10 rounded-md border text-sm font-medium capitalize transition-colors",
                  modelSource === src
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {src}
              </button>
            ))}
          </div>
        </Field>

        {modelSource === "local" ? (
          <OllamaPanel
            host={ollamaHost}
            onHostChange={setOllamaHost}
            value={model}
            onChange={setModel}
          />
        ) : (
          <OpenRouterPanel
            apiKey={openRouterKey}
            onApiKeyChange={setOpenRouterKey}
            value={model}
            onChange={setModel}
          />
        )}
      </Section>

      <Section title="Voice" description="Text-to-speech provider and voice.">
        <Field label="Source">
          <div className="grid grid-cols-2 gap-2">
            {(["local", "cloud"] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setVoiceSource(src)}
                className={cn(
                  "h-10 rounded-md border text-sm font-medium capitalize transition-colors",
                  voiceSource === src
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {src}
              </button>
            ))}
          </div>
        </Field>

        {voiceSource === "local" ? (
          <VoiceLocalPanel
            engine={voiceEngine}
            onEngineChange={setVoiceEngine}
            voice={voiceRef}
            onVoiceChange={setVoiceRef}
          />
        ) : (
          <>
            <Field label="Provider">
              <input
                value={voiceProvider}
                onChange={(e) => setVoiceProvider(e.target.value)}
                placeholder="Provider"
                className={inputCls}
              />
            </Field>
            <Field label="API key">
              <input
                type="password"
                value={voiceKey}
                onChange={(e) => setVoiceKey(e.target.value)}
                placeholder="API key"
                autoComplete="off"
                className={inputCls}
              />
            </Field>
            <Field label="Voice" hint="The voice to use.">
              <input
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="Voice"
                className={inputCls}
              />
            </Field>
          </>
        )}
      </Section>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saveState === "saving"}>
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved"
              : "Save changes"}
        </Button>
      </div>

      <section className="rounded-lg border border-red-500/40 bg-card">
        <div className="border-b border-red-500/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-red-500">Danger Zone</h2>
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Reset to factory restores all settings to defaults and permanently
            wipes every memory container.
          </p>
          <Button
            variant="destructive"
            onClick={factoryReset}
            disabled={resetting}
            className="shrink-0"
          >
            {resetting ? "Resetting…" : "Reset to factory"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </section>
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
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
