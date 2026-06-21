import { BACKEND_URL } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/discord/status`, {
      cache: "no-store",
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return Response.json(
      { running: false, connecting: false, user: null, error: "backend down" },
      { status: 200 },
    );
  }
}
