export const runtime = "nodejs";

// Lists models available on OpenRouter. The model list is public, so no API
// key is required just to populate the selector.
export async function GET() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      cache: "no-store",
    });
    if (!res.ok) {
      return Response.json(
        { error: `OpenRouter responded with ${res.status}` },
        { status: 502 },
      );
    }
    const data = await res.json();
    const models = (data.data ?? []).map(
      (m: { id: string; name?: string }) => ({
        id: m.id,
        name: m.name ?? m.id,
      }),
    );
    return Response.json({ models });
  } catch {
    return Response.json(
      { error: "Could not reach OpenRouter." },
      { status: 502 },
    );
  }
}
