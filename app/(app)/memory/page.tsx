"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemoryGraph } from "@/components/memory/memory-graph";

type Item = {
  id: string;
  text: string;
  key?: string;
  role?: string;
  timestamp?: string;
};

const categories = [
  { title: "Profile", kind: "profile" },
  { title: "Short-term", kind: "short_term" },
  { title: "Long-term", kind: "long_term" },
  { title: "Episodic", kind: "episodic" },
];

export default function MemoryPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [wiping, setWiping] = useState(false);

  async function wipeAll() {
    if (
      !window.confirm(
        "Wipe all memory? This permanently clears every container (profile, short-term, long-term, episodic, graph). This cannot be undone.",
      )
    ) {
      return;
    }
    setWiping(true);
    try {
      await fetch("/api/memory/reset", { method: "POST" });
      setReloadKey((k) => k + 1);
    } catch {
      // ignore
    } finally {
      setWiping(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Memory</h1>
        <Button variant="destructive" onClick={wipeAll} disabled={wiping}>
          {wiping ? "Wiping…" : "Wipe all memory"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <MemoryCard
            key={c.kind}
            title={c.title}
            kind={c.kind}
            reloadKey={reloadKey}
          />
        ))}
      </div>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Node &amp; Graph</h2>
        </div>
        <div className="p-4">
          <MemoryGraph key={reloadKey} />
        </div>
      </section>
    </div>
  );
}

function MemoryCard({
  title,
  kind,
  reloadKey,
}: {
  title: string;
  kind: string;
  reloadKey: number;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memory/${kind}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  async function remove(id: string) {
    await fetch(`/api/memory/${kind}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    load();
  }

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto p-4">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Empty</p>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              className="flex items-start justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
            >
              <div className="text-sm">
                {it.key && <span className="font-medium">{it.key}: </span>}
                {it.role && (
                  <span className="mr-1 text-xs uppercase text-muted-foreground">
                    {it.role}
                  </span>
                )}
                <span>{it.text}</span>
              </div>
              <button
                onClick={() => remove(it.id)}
                className="shrink-0 text-muted-foreground hover:text-red-500"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
