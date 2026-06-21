import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Memory" };

const categories = ["Profile", "Short-term", "Long-term", "Episodic"];

export default function MemoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Memory</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((name) => (
          <MemoryCard key={name} title={name} />
        ))}
      </div>

      <MemoryCard title="Node & Graph" bodyClassName="min-h-[28rem]" />
    </div>
  );
}

function MemoryCard({
  title,
  bodyClassName,
  children,
}: {
  title: string;
  bodyClassName?: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className={["p-4", bodyClassName].filter(Boolean).join(" ")}>
        {children}
      </div>
    </section>
  );
}
