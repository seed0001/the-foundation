"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Model = { id: string; name: string };

const inputCls =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function OpenRouterPanel({
  apiKey,
  onApiKeyChange,
  value,
  onChange,
}: {
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/openrouter/models");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load models");
      setModels(data.models);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load models");
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-medium">API key</span>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="sk-or-…"
          autoComplete="off"
          className={inputCls}
        />
      </label>

      <label className="block space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Model</span>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        >
          <option value="">
            {loading
              ? "Loading…"
              : models.length
                ? "Select a model"
                : "No models found"}
          </option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
