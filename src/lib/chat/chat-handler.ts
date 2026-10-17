import { Agent } from "@earendil-works/pi-agent-core";
import type { Api, Model, Models } from "@earendil-works/pi-ai";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { myPreferencesTool } from "@/lib/agent/preferences-tool";
import { recallMyConversationsTool } from "@/lib/agent/recall-tool";
import { type CopilotUser, USER_HEADER } from "@/lib/conversations/identity";
import { conversationTitle, digestFromAnswer, messageText } from "@/lib/conversations/memory";
import { openuiNotice } from "@/lib/chat/notice";
import { MODEL_HEADER } from "@/lib/models";
import {
  ConversationConflict,
  type ConversationStore,
  type DigestEntry,
  type Preference,
  type UsageInput,
} from "@/lib/conversations/store";

export interface ChatHandlerOptions {
  models: Models;
  /** Resolves a model ID to a model Pi can call; undefined when the ID is not available. */
  modelFor: (modelId: string) => Model<Api> | undefined;
  /** The model a new conversation starts on when the request names none. */
  defaultModelId: string;
  /** The system prompt for a new conversation: who is talking, what they discussed before and how they like answers. */
  systemPrompt: (context: { user: CopilotUser; memory: DigestEntry[]; preferences: Preference[] }) => string;
  /** The domain tools; `recall_my_conversations` and `my_preferences` are added per user and conversation. */
  tools: AgentTool<any>[];
  /** Durable, per-user conversations. */
  conversations: ConversationStore;
  /** Resolves the user a request claims to be (by the ID in the user header). */
  findUser: (userId: string) => CopilotUser | undefined;
  /** Area names, so a digest entry can record the areas an answer named. */
  areaNames?: string[];
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
 * What one answer cost, summed over every model call in the turn (a tool loop is
 * several). Cached prompt tokens count as input; the cost is Pi's, priced from the
 * model's catalog rates. Undefined when the turn made no model call.
 */
function turnUsage(turn: unknown[], firstIndex: number, model: string, latencyMs: number): UsageInput | undefined {
  type Billed = { role?: string; usage?: { input: number; output: number; cacheRead: number; cacheWrite: number; cost: { total: number } } };
  const usage = { messageIndex: -1, model, inputTokens: 0, outputTokens: 0, costUsd: 0, latencyMs: Math.round(latencyMs) };
  turn.forEach((raw, i) => {
    const m = raw as Billed;
    if (m.role !== "assistant" || !m.usage) return;
    usage.messageIndex = firstIndex + i;
    usage.inputTokens += m.usage.input + m.usage.cacheRead + m.usage.cacheWrite;
    usage.outputTokens += m.usage.output;
    usage.costUsd += m.usage.cost.total;
  });
  return usage.messageIndex < 0 ? undefined : usage;
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
export function createChatHandler({
  models,
  modelFor,
  defaultModelId,
  systemPrompt,
  tools,
  conversations,
  findUser,
  areaNames = [],
  getApiKey,
}: ChatHandlerOptions) {
  // One live agent per user and conversation; its state.messages is the server-owned
  // transcript, saved after every answer so a restart (or another session) can resume it.
  const live = new Map<string, Agent>();
  const agentFor = (user: CopilotUser, conversationId: string, model: Model<Api>, transcript: unknown[]): Agent => {
    const key = `${user.userId}:${conversationId}`;
    let agent = live.get(key);
    if (!agent) {
      const history = conversations.forUser(user.userId);
      const conversationTools = [
        ...tools,
        recallMyConversationsTool(user, history, conversationId),
        myPreferencesTool(user, history),
      ];
      agent = new Agent({
        // A resumed transcript carries its own system prompt, so the conversation keeps the digest it started with.
        initialState:
          transcript.length > 0
            ? { model, tools: conversationTools, messages: transcript as Agent["state"]["messages"] }
            : {
                systemPrompt: systemPrompt({
                  user,
                  memory: history.recentDigest({ excludeConversationId: conversationId }),
                  preferences: history.preferences(),
                }),
                model,
                tools: conversationTools,
              },
        streamFn: models.streamSimple.bind(models),
        sessionId: key,
        getApiKey,
      });
      live.set(key, agent);
    }
    return agent;
  };

  return async function POST(req: Request): Promise<Response> {
    const user = findUser(req.headers.get(USER_HEADER)?.trim() ?? "");
    if (!user) {
      return Response.json({ error: `Pick who you are first: send a known user ID in the ${USER_HEADER} header.` }, { status: 401 });
    }
    const history = conversations.forUser(user.userId);
    const body = (await req.json().catch(() => ({}))) as ChatBody;
    const conversationId = body.threadId?.trim() || crypto.randomUUID();
    const lastUser = [...(body.messages ?? [])].reverse().find((m) => m.role === "user");
    const userText = extractText(lastUser?.content).trim();

    // Only this user's conversations are visible: another user's thread ID is simply not found,
    // and cannot be claimed because the ID is taken.
    // A conversation keeps the model it started on; the header only picks the model of a new one.
    let stored = history.get(conversationId);
    let model: Model<Api> | undefined;
    if (stored) {
      model = modelFor(stored.model);
      if (!model) {
        return Response.json({ error: `This conversation uses ${stored.model}, which is no longer available.` }, { status: 409 });
      }
    } else {
      const requested = req.headers.get(MODEL_HEADER)?.trim() || defaultModelId;
      model = modelFor(requested);
      if (!model) return Response.json({ error: `Unknown model ${requested}.` }, { status: 400 });
      live.delete(`${user.userId}:${conversationId}`);
      try {
        history.create({ id: conversationId, title: conversationTitle(userText), model: model.id });
        stored = history.get(conversationId);
      } catch (err) {
        if (!(err instanceof ConversationConflict)) throw err;
        return Response.json({ error: `${user.name} has no conversation ${conversationId}.` }, { status: 404 });
      }
    }
    const agent = agentFor(user, conversationId, model, stored?.transcript ?? []);

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
          const before = agent.state.messages.length;
          const startedAt = performance.now();
          try {
            await agent.prompt(userText);
            if (agent.state.errorMessage) {
              enqueue(chunk({ content: openuiNotice("error", "Model error", agent.state.errorMessage) }));
            } else {
              const answer = agent.state.messages
                .slice(before)
                .filter((m) => m.role === "assistant")
                .map(messageText)
                .findLast((text) => text.trim());
              if (answer) history.recordDigest(conversationId, digestFromAnswer({ question: userText, answer, areaNames }));
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            enqueue(chunk({ content: openuiNotice("error", "Agent error", message) }));
          } finally {
            history.saveTranscript(conversationId, agent.state.messages);
            // Usage is bookkeeping: losing it must not leave the stream open.
            try {
              const usage = turnUsage(agent.state.messages.slice(before), before, model.id, performance.now() - startedAt);
              if (usage) {
                history.recordUsage(conversationId, usage);
                enqueue(`${JSON.stringify({ id: "copilot-chat", object: "chat.completion.chunk", choices: [], usage })}\n`);
              }
            } catch (err) {
              console.error("Could not record answer usage", err);
            }
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
