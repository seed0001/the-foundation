export const runtime = "nodejs";

// Chat endpoint for the AI page. Plug your model in below: read `messages`
// from the request, call your provider, and stream the reply back as text.
export async function POST(req: Request) {
  const { messages } = await req.json();

  // TODO: connect your AI model here and stream its response.
  // `messages` is [{ role: "user" | "assistant", content: string }, ...].
  void messages;

  return new Response("No AI model connected yet.", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
