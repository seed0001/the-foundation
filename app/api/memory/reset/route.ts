import { BACKEND_URL } from "@/lib/backend";

export const runtime = "nodejs";

// Wipes every memory container. (Static segment takes precedence over [kind].)
export async function POST() {
  const res = await fetch(`${BACKEND_URL}/memory/reset`, { method: "POST" });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
