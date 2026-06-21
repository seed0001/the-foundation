"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OllamaPanel } from "@/components/settings/ollama-panel";
import { OpenRouterPanel } from "@/components/settings/openrouter-panel";

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
  const [voiceModel, setVoiceModel] = useState("");
  const [voiceLocation, setVoiceLocation] = useState("");
  const [voiceProvider, setVoiceProvider] = useState("");
  const [voiceKey, setVoiceKey] = useState("");
  const [voiceName, setVoiceName] = useState("");
  const voiceFileRef = useRef<HTMLInputElement>(null);

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
          <>
            <Field label="Local model" hint="The local TTS model to use.">
              <input
                value={voiceModel}
                onChange={(e) => setVoiceModel(e.target.value)}
                placeholder="Model identifier"
                className={inputCls}
              />
            </Field>
            <Field
              label="Voice location"
              hint="Path to the voice file, or import one."
            >
              <div className="flex gap-2">
                <input
                  value={voiceLocation}
                  onChange={(e) => setVoiceLocation(e.target.value)}
                  placeholder="/path/to/voice"
                  className={cn(inputCls, "flex-1")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => voiceFileRef.current?.click()}
                >
                  Import
                </Button>
                <input
                  ref={voiceFileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setVoiceLocation(file.name);
                  }}
                />
              </div>
            </Field>
          </>
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
        <Button>Save changes</Button>
      </div>
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
