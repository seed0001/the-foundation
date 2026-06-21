import { BACKEND_URL } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/graph`, { cache: "no-store" });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
