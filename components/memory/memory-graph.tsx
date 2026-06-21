"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// react-force-graph touches `window`, so load it client-side only.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

type GraphData = {
  nodes: { id: string; label: string }[];
  links: { source: string; target: string }[];
};

export function MemoryGraph() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [width, setWidth] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((g) => {
        setData({
          nodes: g.nodes ?? [],
          links: (g.edges ?? []).map((e: { source: string; target: string }) => ({
            source: e.source,
            target: e.target,
          })),
        });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-[28rem] w-full">
      {loaded && data.nodes.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No notes yet — they appear as the AI links entities.
        </div>
      ) : (
        width > 0 && (
          <ForceGraph2D
            width={width}
            height={448}
            graphData={data}
            backgroundColor="rgba(0,0,0,0)"
            linkColor={() => "rgba(140,140,140,0.35)"}
            nodeRelSize={4}
            nodeCanvasObject={(
              node: any,
              ctx: CanvasRenderingContext2D,
              globalScale: number,
            ) => {
              const label = node.label || node.id;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
              ctx.fillStyle = "#14b8a6";
              ctx.fill();
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px sans-serif`;
              ctx.fillStyle = "#9ca3af";
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillText(label, node.x, node.y + 6);
            }}
          />
        )
      )}
    </div>
  );
}
