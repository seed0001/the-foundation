import { BACKEND_URL } from "@/lib/backend";

export const runtime = "nodejs";

export async function POST() {
  const res = await fetch(`${BACKEND_URL}/discord/start`, { method: "POST" });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
