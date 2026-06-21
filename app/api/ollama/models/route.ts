export const runtime = "nodejs";

// Lists models installed in a local Ollama instance.
// Proxies http://<host>/api/tags so the browser avoids CORS, and so the
// request originates from this machine (where Ollama runs).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = (searchParams.get("host") || "http://localhost:11434").replace(
    /\/$/,
    "",
  );

  try {
    const res = await fetch(`${host}/api/tags`, { cache: "no-store" });
    if (!res.ok) {
      return Response.json(
        { error: `Ollama responded with ${res.status}` },
        { status: 502 },
      );
    }
    const data = await res.json();
    const models: string[] = (data.models ?? []).map(
      (m: { name: string }) => m.name,
    );
    return Response.json({ models });
  } catch {
    return Response.json(
      { error: `Could not reach Ollama at ${host}. Is it running?` },
      { status: 502 },
    );
  }
}
