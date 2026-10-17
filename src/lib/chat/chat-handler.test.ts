import {
  createModels,
  fauxAssistantMessage,
  fauxProvider,
  fauxText,
  fauxToolCall,
} from "@earendil-works/pi-ai";
import { type Message, processStreamedMessage } from "@openuidev/react-headless";
import { createParser } from "@openuidev/react-lang";
import { beforeEach, describe, expect, it } from "vitest";
import { pingTool } from "@/lib/agent/tools";
import { copilotLibrary } from "@/lib/openui/library";
import { createChatHandler } from "./chat-handler";
import { copilotStreamAdapter } from "./stream-adapter";

interface Chunk {
  object: string;
  choices: Array<{
    delta: {
      role?: string;
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason: string | null;
  }>;
}

const ANSWER = `root = Stack([card, sources])
card = Card([CardHeader("Pong")])
sources = Sources([SourceItem("document", "ping", "Ping tool")])`;

let faux: ReturnType<typeof fauxProvider>;
let chat: ReturnType<typeof createChatHandler>;

beforeEach(() => {
  faux = fauxProvider({ tokenSize: { min: 1, max: 1 } });
  const models = createModels();
  models.setProvider(faux.provider);
  chat = createChatHandler({
    models,
    model: faux.getModel(),
    systemPrompt: "You are a test copilot.",
    tools: [pingTool],
  });
});

function post(body: unknown): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readChunks(res: Response): Promise<Chunk[]> {
  const text = await res.text();
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Chunk);
}

/** Feeds the response through the OpenUI chat shell's stream processing; returns the thread. */
async function renderInShell(res: Response): Promise<Message[]> {
  globalThis.requestAnimationFrame ??= (cb) => setTimeout(() => cb(0), 0) as unknown as number;
  globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);
  const thread = new Map<string, Message>();
  const upsert = (m: Message) => thread.set(m.id, m);
  await processStreamedMessage({
    response: res,
    adapter: copilotStreamAdapter(),
    createMessage: upsert,
    updateMessage: upsert,
  });
  return [...thread.values()];
}

const contentOf = (chunks: Chunk[]) =>
  chunks.map((c) => c.choices[0]?.delta.content ?? "").join("");

describe("chat route", () => {
  it("streams the assistant's OpenUI answer as progressive content chunks", async () => {
    faux.setResponses([fauxAssistantMessage([fauxText(ANSWER)])]);

    const res = await chat(post({ threadId: "t1", messages: [{ role: "user", content: "ping" }] }));
    const chunks = await readChunks(res);

    expect(res.ok).toBe(true);
    expect(chunks.every((c) => c.object === "chat.completion.chunk")).toBe(true);
    expect(chunks[0]?.choices[0]?.delta.role).toBe("assistant");
    expect(chunks.filter((c) => c.choices[0]?.delta.content).length).toBeGreaterThan(1);
    expect(contentOf(chunks)).toBe(ANSWER);
    expect(chunks.at(-1)?.choices[0]?.finish_reason).toBe("stop");
  });

  it("shows the ping tool's start and completed result in the chat shell's tool trace", async () => {
    faux.setResponses([
      fauxAssistantMessage(
        [fauxText("Let me check."), fauxToolCall("ping", { message: "hello" }, { id: "call-1" })],
        { stopReason: "toolUse" },
      ),
      fauxAssistantMessage([fauxText(ANSWER)]),
    ]);

    const messages = await renderInShell(
      await chat(post({ threadId: "t1", messages: [{ role: "user", content: "ping hello" }] })),
    );

    const toolCall = messages
      .flatMap((m) => (m.role === "assistant" ? (m.toolCalls ?? []) : []))
      .find((tc) => tc.id === "call-1");
    expect(toolCall?.function.name).toBe("ping");
    expect(JSON.parse(toolCall?.function.arguments ?? "")).toEqual({ message: "hello" });

    const result = messages.find((m) => m.role === "tool" && m.toolCallId === "call-1");
    expect(result?.role === "tool" && result.content).toContain("pong: hello");

    // Text written before the tool call must not leak into the final answer.
    expect(messages.filter((m) => m.role === "assistant").at(-1)?.content).toBe(ANSWER);
  });

  it("feeds Pi only the newest user message and keeps the transcript per conversation", async () => {
    const userTextsSeen: string[][] = [];
    const answer = (text: string) => (context: { messages: Array<{ role: string; content: unknown }> }) => {
      userTextsSeen.push(
        context.messages
          .filter((m) => m.role === "user")
          .map((m) =>
            typeof m.content === "string"
              ? m.content
              : (m.content as Array<{ text?: string }>).map((part) => part.text ?? "").join(""),
          ),
      );
      return fauxAssistantMessage([fauxText(text)]);
    };
    faux.setResponses([answer("first answer"), answer("second answer"), answer("other answer")]);

    await readChunks(await chat(post({ threadId: "t1", messages: [{ role: "user", content: "first" }] })));
    await readChunks(
      await chat(
        post({
          threadId: "t1",
          messages: [
            { role: "user", content: "first" },
            { role: "assistant", content: "first answer" },
            { role: "user", content: "second" },
          ],
        }),
      ),
    );
    await readChunks(await chat(post({ threadId: "t2", messages: [{ role: "user", content: "other" }] })));

    expect(userTextsSeen).toEqual([["first"], ["first", "second"], ["other"]]);
  });

  it("renders a model failure as an OpenUI error callout instead of unparseable text", async () => {
    faux.setResponses([
      fauxAssistantMessage([], { stopReason: "error", errorMessage: '401: {"message":"Bad key"}' }),
    ]);

    const chunks = await readChunks(
      await chat(post({ threadId: "t1", messages: [{ role: "user", content: "ping" }] })),
    );

    const parsed = createParser(copilotLibrary.toJSONSchema(), copilotLibrary.root).parse(
      contentOf(chunks),
    );
    expect(parsed.meta.errors).toEqual([]);
    expect(parsed.root?.typeName).toBe("Stack");
    expect(JSON.stringify(parsed.root)).toContain('"typeName":"Callout"');
    expect(JSON.stringify(parsed.root)).toContain("Bad key");
  });
});
