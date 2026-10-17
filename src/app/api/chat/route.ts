import { openRouterChatOptions } from "@/lib/agent/openrouter";
import { createChatHandler } from "@/lib/chat/chat-handler";

// Pi talks to OpenRouter over Node streams; not available on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Created on first request so a missing key fails the request, not the build.
let chat: ReturnType<typeof createChatHandler> | undefined;

export async function POST(req: Request): Promise<Response> {
  try {
    chat ??= createChatHandler(openRouterChatOptions());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
  return chat(req);
}
