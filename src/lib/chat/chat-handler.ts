import { Agent } from "@earendil-works/pi-agent-core";
import type { Api, Model, Models } from "@earendil-works/pi-ai";
import { copilotTools } from "@/lib/agent/tools";

export interface ChatHandlerOptions {
  models: Models;
  model: Model<Api>;
  systemPrompt: string;
  /** Explicit provider key; when omitted the provider resolves its own (env) auth. */
  getApiKey?: (provider: string) => string | undefined;
}

interface ChatBody {
  threadId?: string;
  messages?: Array<{ role?: string; content?: unknown }>;
}

/**
 * One newline-delimited OpenAI `chat.completion.chunk`, the format the
 * frontend's `openAIReadableStreamAdapter()` parses.
 */
function chunk(delta: Record<string, unknown>, finishReason: string | null = null): string {
  return `${JSON.stringify({
    id: "copilot-chat",
    object: "chat.completion.chunk",
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  })}\n`;
}

/**
 * A standalone OpenUI Lang answer holding one Callout. The chat renders content
 * as OpenUI Lang, so plain-text notices would fail to parse. A later `root`
 * overrides an earlier one, so this also replaces a partial answer that ended
 * on a statement boundary.
 */
function openuiNotice(variant: "info" | "error", title: string, description: string): string {
  return `\nroot = Stack([copilotNotice])\ncopilotNotice = Callout(${JSON.stringify(variant)}, ${JSON.stringify(title)}, ${JSON.stringify(description)})\n`;
}

function safeArgs(args: unknown): string {
  try {
    return JSON.stringify(args ?? {});
  } catch {
    return String(args);
  }
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (part && typeof part === "object" && "text" in part ? String(part.text) : ""))
      .join("");
  }
  return "";
}

const STREAM_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
};

/**
 * Builds the `/api/chat` POST handler. The OpenUI shell re-sends the whole
 * thread each turn, but each conversation's Pi agent owns its transcript, so
 * only the newest user message is fed into Pi.
 */
export function createChatHandler({ models, model, systemPrompt, getApiKey }: ChatHandlerOptions) {
  // One agent per conversation; its state.messages is the server-owned transcript.
  // In memory for now, so transcripts are lost on restart.
  const conversations = new Map<string, Agent>();
  const agentFor = (conversationId: string): Agent => {
    let agent = conversations.get(conversationId);
    if (!agent) {
      agent = new Agent({
        initialState: { systemPrompt, model, tools: copilotTools },
        streamFn: models.streamSimple.bind(models),
        sessionId: conversationId,
        getApiKey,
      });
      conversations.set(conversationId, agent);
    }
    return agent;
  };

  return async function POST(req: Request): Promise<Response> {
    const body = (await req.json().catch(() => ({}))) as ChatBody;
    const conversationId = body.threadId?.trim() || crypto.randomUUID();
    const lastUser = [...(body.messages ?? [])].reverse().find((m) => m.role === "user");
    const userText = extractText(lastUser?.content).trim();
    const agent = agentFor(conversationId);

    // An overlapping turn would interleave two streams into one transcript.
    if (agent.state.isStreaming || !userText) {
      const notice = agent.state.isStreaming
        ? openuiNotice("info", "Still answering", "Please wait for the previous answer to finish.")
        : openuiNotice("info", "Empty message", "No user message was provided.");
      return new Response(
        chunk({ role: "assistant" }) + chunk({ content: notice }) + chunk({}, "stop"),
        { headers: STREAM_HEADERS },
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let closed = false;
        const enqueue = (line: string) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(line));
          } catch {
            closed = true; // client disconnected
          }
        };

        enqueue(chunk({ role: "assistant" }));

        // Tool executions become tool_calls deltas (start) and OpenAI-style
        // `role: "tool"` deltas (end, with the result), which the shell's
        // stream adapter turns into the visible tool trace.
        let nextToolIndex = 0;

        const unsubscribe = agent.subscribe((event) => {
          if (event.type === "message_update") {
            const update = event.assistantMessageEvent;
            if (update.type === "text_delta" && update.delta) {
              enqueue(chunk({ content: update.delta }));
            }
          } else if (event.type === "tool_execution_start") {
            enqueue(
              chunk({
                tool_calls: [
                  {
                    index: nextToolIndex++,
                    id: event.toolCallId,
                    type: "function",
                    function: { name: event.toolName, arguments: safeArgs(event.args) },
                  },
                ],
              }),
            );
          } else if (event.type === "tool_execution_end") {
            enqueue(
              chunk({
                role: "tool",
                tool_call_id: event.toolCallId,
                content: extractText(event.result?.content),
                ...(event.isError ? { is_error: true } : {}),
              }),
            );
          }
        });

        const onAbort = () => agent.abort();
        req.signal.addEventListener("abort", onAbort);

        void (async () => {
          try {
            await agent.prompt(userText);
            if (agent.state.errorMessage) {
              enqueue(chunk({ content: openuiNotice("error", "Model error", agent.state.errorMessage) }));
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            enqueue(chunk({ content: openuiNotice("error", "Agent error", message) }));
          } finally {
            unsubscribe();
            req.signal.removeEventListener("abort", onAbort);
            enqueue(chunk({}, "stop"));
            if (!closed) {
              closed = true;
              controller.close();
            }
          }
        })();
      },
    });

    return new Response(stream, { headers: STREAM_HEADERS });
  };
}
