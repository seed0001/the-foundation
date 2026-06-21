import { BACKEND_URL } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/settings`, { cache: "no-store" });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

export async function PUT(req: Request) {
  const body = await req.text();
  const res = await fetch(`${BACKEND_URL}/settings`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body,
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
