import { BACKEND_URL } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/voices`, { cache: "no-store" });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

// Forward the multipart upload to the backend.
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  const body = await req.arrayBuffer();
  const res = await fetch(`${BACKEND_URL}/voices`, {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

export async function DELETE(req: Request) {
  const name = new URL(req.url).searchParams.get("name");
  if (!name) {
    return Response.json({ error: "Missing name" }, { status: 400 });
  }
  const res = await fetch(
    `${BACKEND_URL}/voices/${encodeURIComponent(name)}`,
    { method: "DELETE" },
  );
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
