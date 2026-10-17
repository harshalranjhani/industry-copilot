import { type CopilotUser, USER_HEADER } from "@/lib/conversations/identity";
import { conversationTitle, messageText } from "@/lib/conversations/memory";
import type { Conversation, ConversationStore } from "@/lib/conversations/store";
import { isAllowedModel, MODEL_HEADER } from "@/lib/models";

export interface ThreadsHandlerOptions {
  conversations: ConversationStore;
  findUser: (userId: string) => CopilotUser | undefined;
  /** The model a new conversation starts with. */
  modelId: string;
}

/** The chat shell's thread shape. */
const toThread = (c: Conversation) => ({ id: c.id, title: c.title, createdAt: c.createdAt });

interface ShellMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
  toolCallId?: string;
}

/** A stored Pi transcript as the chat shell's messages, tool trace included. */
export function toShellMessages(transcript: unknown[]): ShellMessage[] {
  const out: ShellMessage[] = [];
  transcript.forEach((raw, index) => {
    const message = raw as { role?: string; content?: unknown; toolCallId?: string; isError?: boolean };
    const id = `m${index}`;
    if (message.role === "user") {
      out.push({ id, role: "user", content: messageText(message) });
    } else if (message.role === "assistant") {
      const calls = Array.isArray(message.content)
        ? (message.content as Array<{ type?: string; id?: string; name?: string; arguments?: unknown }>).filter((p) => p.type === "toolCall")
        : [];
      out.push({
        id,
        role: "assistant",
        // Text written before a tool call is narration, not the answer.
        content: calls.length ? "" : messageText(message),
        ...(calls.length && {
          toolCalls: calls.map((c) => ({
            id: String(c.id),
            type: "function" as const,
            function: { name: String(c.name), arguments: JSON.stringify(c.arguments ?? {}) },
          })),
        }),
      });
    } else if (message.role === "toolResult" && message.toolCallId) {
      out.push({ id, role: "tool", content: messageText(message), toolCallId: message.toolCallId });
    }
  });
  return out;
}

/**
 * The REST thread endpoints the chat shell's sidebar talks to
 * (`restStorage`). Every call is bound to the user in the request's header,
 * so a thread ID that belongs to someone else is just not found.
 */
export function createThreadsHandler({ conversations, findUser, modelId }: ThreadsHandlerOptions) {
  const withUser = async (req: Request, run: (history: ReturnType<ConversationStore["forUser"]>) => Promise<Response> | Response) => {
    const user = findUser(req.headers.get(USER_HEADER)?.trim() ?? "");
    if (!user) return Response.json({ error: "Pick who you are first." }, { status: 401 });
    return run(conversations.forUser(user.userId));
  };
  const notFound = () => Response.json({ error: "No such conversation." }, { status: 404 });

  return {
    list: (req: Request) => withUser(req, (history) => Response.json({ threads: history.list().map(toThread) })),

    create: (req: Request) =>
      withUser(req, async (history) => {
        const body = (await req.json().catch(() => ({}))) as { messages?: Array<{ content?: unknown }> };
        const first = messageText(body.messages?.[0]).trim();
        const model = req.headers.get(MODEL_HEADER)?.trim() || modelId;
        if (!isAllowedModel(model)) return Response.json({ error: `Unknown model ${model}.` }, { status: 400 });
        return Response.json(toThread(history.create({ title: conversationTitle(first), model })));
      }),

    get: (req: Request, id: string) =>
      withUser(req, (history) => {
        const conversation = history.get(id);
        return conversation ? Response.json(toShellMessages(conversation.transcript)) : notFound();
      }),

    /** What each answer in the conversation cost, keyed by the shell message ID it belongs to. */
    usage: (req: Request, id: string) =>
      withUser(req, (history) =>
        history.get(id)
          ? Response.json({
              usage: Object.fromEntries(
                history.usage(id).map(({ messageIndex, ...u }) => [`m${messageIndex}`, u]),
              ),
            })
          : notFound(),
      ),

    update: (req: Request, id: string) =>
      withUser(req, async (history) => {
        const body = (await req.json().catch(() => ({}))) as { title?: string };
        const renamed = body.title?.trim() ? history.rename(id, body.title.trim()) : history.get(id);
        return renamed ? Response.json(toThread(renamed)) : notFound();
      }),

    remove: (req: Request, id: string) =>
      withUser(req, (history) => (history.remove(id) ? Response.json({ ok: true }) : notFound())),
  };
}
