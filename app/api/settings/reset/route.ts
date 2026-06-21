import { BACKEND_URL } from "@/lib/backend";

export const runtime = "nodejs";

// Factory reset: settings back to defaults and all memory wiped.
export async function POST() {
  const res = await fetch(`${BACKEND_URL}/settings/reset`, { method: "POST" });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
