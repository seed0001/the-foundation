import { BACKEND_URL } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params;
  const res = await fetch(`${BACKEND_URL}/memory/${kind}`, {
    cache: "no-store",
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }
  const res = await fetch(
    `${BACKEND_URL}/memory/${kind}/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
