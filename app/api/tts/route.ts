import { BACKEND_URL } from "@/lib/backend";

export const runtime = "nodejs";

// Proxies a TTS request to the backend and returns the audio bytes.
export async function POST(req: Request) {
  const body = await req.text();
  const res = await fetch(`${BACKEND_URL}/tts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  if (!res.ok) {
    return new Response(await res.text(), {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": "audio/wav",
      "cache-control": "no-store",
    },
  });
}
