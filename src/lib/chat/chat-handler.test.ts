import {
  createModels,
  fauxAssistantMessage,
  fauxProvider,
  fauxText,
  fauxToolCall,
} from "@earendil-works/pi-ai";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { type Message, processStreamedMessage } from "@openuidev/react-headless";
import { createParser } from "@openuidev/react-lang";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { pingTool } from "@/lib/agent/tools";
import { type ConversationStore, openConversationStore } from "@/lib/conversations/store";
import { USER_HEADER } from "@/lib/conversations/identity";
import { MODEL_HEADER } from "@/lib/models";
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

const USERS = [
  { userId: "U-201", name: "Michael Turner", role: "production_supervisor" },
  { userId: "U-202", name: "Jessica Reed", role: "field_inspector" },
];
const MICHAEL = "U-201";
const JESSICA = "U-202";

let faux: ReturnType<typeof fauxProvider>;
let chat: ReturnType<typeof createChatHandler>;
let workDir: string;
let stores: ConversationStore[];

/** A chat route over the conversation file; calling it again simulates a server restart. */
function startServer(tools: AgentTool<any>[] = [pingTool]): ReturnType<typeof createChatHandler> {
  const store = openConversationStore(join(workDir, "conversations.db"));
  stores.push(store);
  const models = createModels();
  models.setProvider(faux.provider);
  return createChatHandler({
    models,
    modelFor: (id) => faux.getModel(id),
    defaultModelId: "faux-a",
    systemPrompt: ({ user, memory }) =>
      `You are a test copilot talking to ${user.name}.\n${memory.map((m) => `Earlier: ${m.question} -> ${m.summary} [${m.wells.join(", ")}]`).join("\n")}`,
    tools,
    conversations: store,
    findUser: (id) => USERS.find((u) => u.userId === id),
    areaNames: ["Northeast Block 7"],
  });
}

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "copilot-chat-"));
  stores = [];
  faux = fauxProvider({ tokenSize: { min: 1, max: 1 }, models: [{ id: "faux-a" }, { id: "faux-b" }] });
  chat = startServer();
});

afterEach(() => {
  for (const store of stores) store.close();
  rmSync(workDir, { recursive: true, force: true });
});

function post(body: unknown, userId: string = MICHAEL, model?: string): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", [USER_HEADER]: userId, ...(model && { [MODEL_HEADER]: model }) },
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

  it("reports a failing tool as an errored tool result and still lets the model answer", async () => {
    const brokenTool: AgentTool<any> = {
      ...pingTool,
      execute: async () => {
        throw new Error("Database is locked");
      },
    };
    chat = startServer([brokenTool]);
    faux.setResponses([
      fauxAssistantMessage([fauxToolCall("ping", {}, { id: "call-1" })], { stopReason: "toolUse" }),
      fauxAssistantMessage([fauxText(ANSWER)]),
    ]);

    const chunks = await readChunks(await chat(post({ threadId: "t1", messages: [{ role: "user", content: "ping" }] })));

    const failed = chunks.map((c) => c.choices[0]?.delta as Record<string, unknown>).find((d) => d.role === "tool");
    expect(failed).toMatchObject({ tool_call_id: "call-1", is_error: true });
    expect(String(failed?.content)).toContain("Database is locked");
    expect(contentOf(chunks)).toContain("Card(");
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

/** Everything the model was shown on one request: system prompt, history, tool results. */
const asSeen = (context: { messages: unknown[] }) => JSON.stringify(context.messages);

describe("private memory", () => {
  it("resumes a conversation after a server restart with the transcript intact", async () => {
    const seen: string[] = [];
    const answer = (text: string) => (context: { messages: unknown[] }) => {
      seen.push(asSeen(context));
      return fauxAssistantMessage([fauxText(text)]);
    };
    faux.setResponses([answer("The ranking is ready."), answer("Second answer.")]);

    await readChunks(await chat(post({ threadId: "t1", messages: [{ role: "user", content: "rank NE-07 wells" }] })));
    const afterRestart = startServer();
    await readChunks(
      await afterRestart(post({ threadId: "t1", messages: [{ role: "user", content: "and now costs?" }] })),
    );

    expect(seen[1]).toContain("rank NE-07 wells");
    expect(seen[1]).toContain("The ranking is ready.");
    expect(seen[1]).toContain("and now costs?");
  });

  const RANKING = `root = Stack([text, sources])
text = TextContent("Top three wells in Northeast Block 7 by downtime: WELL-0121, WELL-0138 and WELL-0107.")
sources = Sources([SourceItem("inspection", "INS-0121-0010", "Non-producing inspection")])`;

  /** Michael's day 1: he asks Q6 in his own chat. */
  async function michaelAsksQ6() {
    faux.setResponses([fauxAssistantMessage([fauxText(RANKING)])]);
    await readChunks(
      await chat(post({ threadId: "day-1", messages: [{ role: "user", content: "Rank Northeast Block 7 wells by downtime this year" }] })),
    );
  }

  /** Runs one new chat as a user and returns everything the model was shown. */
  async function newChat(userId: string, threadId: string, question: string): Promise<string> {
    let seen = "";
    faux.setResponses([
      (context: { messages: unknown[] }) => {
        seen = asSeen(context);
        return fauxAssistantMessage([fauxText("ok")]);
      },
    ]);
    await readChunks(await chat(post({ threadId, messages: [{ role: "user", content: question }] }, userId)));
    return seen;
  }

  it("gives a new conversation the user's recent answers, naming the wells they covered (Q11)", async () => {
    await michaelAsksQ6();

    const seen = await newChat(MICHAEL, "day-2", "For the three wells we discussed yesterday, what have repairs cost this year?");

    expect(seen).toContain("Michael Turner");
    expect(seen).toContain("Rank Northeast Block 7 wells by downtime this year");
    expect(seen).toContain("WELL-0121, WELL-0138, WELL-0107");
  });

  it("never shows another user's history in a new conversation (Q16, second part)", async () => {
    await michaelAsksQ6();

    const seen = await newChat(JESSICA, "jessica-1", "For the three wells we discussed yesterday, what have repairs cost this year?");

    expect(seen).toContain("Jessica Reed");
    expect(seen).not.toContain("WELL-0121");
    expect(seen).not.toContain("Rank Northeast Block 7");
  });

  it("recalls only the asking user's conversations through recall_my_conversations", async () => {
    await michaelAsksQ6();
    const recall = (userId: string, threadId: string) => {
      let result = "";
      faux.setResponses([
        fauxAssistantMessage([fauxToolCall("recall_my_conversations", { text: "WELL-0121" }, { id: "recall-1" })], {
          stopReason: "toolUse",
        }),
        (context: { messages: unknown[] }) => {
          result = JSON.stringify(
            (context.messages as Array<{ role: string }>).filter((m) => m.role === "toolResult"),
          );
          return fauxAssistantMessage([fauxText("ok")]);
        },
      ]);
      return chat(post({ threadId, messages: [{ role: "user", content: "which wells did we discuss?" }] }, userId))
        .then(readChunks)
        .then(() => result);
    };

    const michael = await recall(MICHAEL, "day-2");
    const jessica = await recall(JESSICA, "jessica-1");

    expect(michael).toContain("WELL-0138");
    expect(jessica).not.toContain("WELL-0121");
    expect(jessica).toContain("no earlier conversation");
  });

  it("does not let another user open or continue a conversation by its ID", async () => {
    await michaelAsksQ6();
    let jessicaSaw = "";
    faux.setResponses([
      (context: { messages: unknown[] }) => {
        jessicaSaw = asSeen(context);
        return fauxAssistantMessage([fauxText("ok")]);
      },
    ]);

    const res = await chat(post({ threadId: "day-1", messages: [{ role: "user", content: "what did we cover?" }] }, JESSICA));

    expect(res.status).toBe(404);
    expect(jessicaSaw).toBe("");
    expect(faux.getPendingResponseCount()).toBe(1);
  });

  it("rejects a request that does not say who is asking", async () => {
    const res = await chat(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: "t9", messages: [{ role: "user", content: "hi" }] }),
      }),
    );

    expect(res.status).toBe(401);
  });
});

describe("model switcher", () => {
  /** Queues a plain answer that records which model produced it. */
  function recordModels(count: number): string[] {
    const used: string[] = [];
    faux.setResponses(
      Array.from({ length: count }, () => (_ctx: unknown, _opts: unknown, _state: unknown, model: { id: string }) => {
        used.push(model.id);
        return fauxAssistantMessage([fauxText("ok")]);
      }),
    );
    return used;
  }
  const ask = (c: typeof chat, threadId: string, model?: string) =>
    c(post({ threadId, messages: [{ role: "user", content: "hello" }] }, MICHAEL, model)).then(readChunks);

  it("starts a conversation on the model the builder picked, and every later turn keeps it", async () => {
    const used = recordModels(4);

    await ask(chat, "t1", "faux-b");
    await ask(chat, "t1", "faux-a"); // the dropdown moved on, the conversation did not
    await ask(chat, "t1");
    await ask(startServer(), "t1"); // resumed after a restart

    expect(used).toEqual(["faux-b", "faux-b", "faux-b", "faux-b"]);
  });

  it("starts a conversation on the default model when none is picked", async () => {
    const used = recordModels(1);

    await ask(chat, "t1");

    expect(used).toEqual(["faux-a"]);
  });

  it("rejects a model that is not available, without creating the conversation", async () => {
    const res = await chat(post({ threadId: "t1", messages: [{ role: "user", content: "hello" }] }, MICHAEL, "nobody/nothing"));

    expect(res.status).toBe(400);
    expect(await res.text()).toContain("nobody/nothing");
  });
});

describe("usage tracking", () => {
  const usageOf = (chunks: Chunk[]) => chunks.map((c) => (c as Chunk & { usage?: Record<string, unknown> }).usage).find(Boolean);

  it("reports the model, tokens, cost and latency of each answer, summed over its model calls", async () => {
    faux.setResponses([
      fauxAssistantMessage([fauxToolCall("ping", { message: "hi" }, { id: "c1" })], { stopReason: "toolUse" }),
      fauxAssistantMessage([fauxText(ANSWER)]),
    ]);

    const chunks = await readChunks(await chat(post({ threadId: "t1", messages: [{ role: "user", content: "ping hi" }] }, MICHAEL, "faux-b")));

    const usage = usageOf(chunks);
    expect(usage).toMatchObject({ model: "faux-b" });
    expect(usage?.inputTokens).toBeGreaterThan(0);
    expect(usage?.outputTokens).toBeGreaterThan(0);
    expect(typeof usage?.costUsd).toBe("number");
    expect(usage?.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
