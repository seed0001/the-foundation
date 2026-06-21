import { BACKEND_URL } from "@/lib/backend";

export const runtime = "nodejs";

// Proxies the chat request to the Python backend and streams the reply back.
export async function POST(req: Request) {
  const body = await req.text();
  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    return new Response(res.body, {
      status: res.status,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response(
      "Backend not reachable. Is the Python server running on port 8000?",
      { status: 502, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }
}
