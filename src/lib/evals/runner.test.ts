import { createModels, fauxAssistantMessage, fauxProvider, fauxText, fauxToolCall } from "@earendil-works/pi-ai";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { pingTool } from "@/lib/agent/tools";
import { createChatHandler } from "@/lib/chat/chat-handler";
import { USER_HEADER } from "@/lib/conversations/identity";
import { MODEL_HEADER } from "@/lib/models";
import { openConversationStore } from "@/lib/conversations/store";
import { addChatEntry, openKnowledgeStore, replaceDatasetKnowledge } from "@/lib/data/knowledge";
import { runEvals } from "./runner";
import type { ScenarioFile, ScenarioStep } from "./scenarios";

const USERS = [
  { userId: "U-201", name: "Michael Turner", role: "production_supervisor" },
  { userId: "U-202", name: "Jessica Reed", role: "field_inspector" },
];

const ANSWER = `root = Stack([card, sources])
card = Card([CardHeader("WELL-0001 is not producing oil")])
sources = Sources([SourceItem("inspection", "INS-0001-0203", "Latest inspection")])`;

/** What the grader model says: the numbers are the 1-based expected facts it found in the answer. */
const verdict = (matched: number[], extra: { sourcesCited?: boolean; visualMatches?: boolean } = {}) =>
  JSON.stringify({ matched, sourcesCited: true, visualMatches: true, comment: "ok", ...extra });

const step = (overrides: Partial<ScenarioStep> = {}): ScenarioStep => ({
  id: "Q1",
  user: "Michael Turner",
  chat: "new",
  question: "Is WELL-0001 producing oil right now?",
  expectedFacts: ["WELL-0001 is not producing oil", "Latest inspection is INS-0001-0203"],
  expectedVisual: "none",
  ...overrides,
});
const scenarios = (...steps: ScenarioStep[]): ScenarioFile => ({ name: "Test scenarios", steps });

let faux: ReturnType<typeof fauxProvider>;
let workDir: string;
let knowledgePath: string;
let conversationsPath: string;
let chatRequests: Array<{ user: string | null; model: string | null; threadId: string }>;

/** Runs the real chat route over the faux provider, the way the CLI wires the real one. */
function run(file: ScenarioFile, options: { model?: string } = {}) {
  const models = createModels();
  models.setProvider(faux.provider);
  return runEvals({
    scenarios: file,
    model: options.model,
    defaultModelId: "faux-a",
    stores: { knowledgePath, conversationsPath },
    openChat: () => {
      const store = openConversationStore(conversationsPath);
      const handler = createChatHandler({
        models,
        modelFor: (id) => faux.getModel(id),
        defaultModelId: "faux-a",
        systemPrompt: ({ user, memory }) =>
          `You are a test copilot talking to ${user.name}.\n${memory.map((m) => `Earlier: ${m.question} -> ${m.summary}`).join("\n")}`,
        tools: [pingTool],
        conversations: store,
        findUser: (id) => USERS.find((u) => u.userId === id),
      });
      return {
        chat: (req: Request) => {
          void req
            .clone()
            .json()
            .then((body) => chatRequests.push({ user: req.headers.get(USER_HEADER), model: req.headers.get(MODEL_HEADER), threadId: body.threadId }));
          return handler(req);
        },
        close: () => store.close(),
      };
    },
    resolveUser: (name) => USERS.find((u) => u.name === name)?.userId,
    grader: { models, model: faux.getModel("faux-g")! },
  });
}

/** Everything the copilot model was shown on one request: system prompt, history. */
const asSeen = (context: { messages: unknown[] }) => JSON.stringify(context.messages);

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "copilot-evals-"));
  chatRequests = [];
  knowledgePath = join(workDir, "knowledge.db");
  conversationsPath = join(workDir, "conversations.db");
  faux = fauxProvider({ tokenSize: { min: 1, max: 1 }, models: [{ id: "faux-a" }, { id: "faux-b" }, { id: "faux-g" }] });
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe("runEvals", () => {
  it("asks the question as the step's user, has the grader judge the answer, and records answer, grade and usage", async () => {
    faux.setResponses([fauxAssistantMessage([fauxText(ANSWER)]), fauxAssistantMessage([fauxText(verdict([1, 2]))])]);

    const result = await run(scenarios(step()));

    expect(chatRequests[0]?.user).toBe("U-201");
    const [r] = result.steps;
    expect(r).toMatchObject({
      step: { id: "Q1" },
      answer: ANSWER,
      model: "faux-a",
      grade: {
        pass: true,
        matchedFacts: ["WELL-0001 is not producing oil", "Latest inspection is INS-0001-0203"],
        missedFacts: [],
        sourcesCited: true,
        visualMatches: true,
      },
    });
    expect(r?.inputTokens).toBeGreaterThan(0);
    expect(r?.outputTokens).toBeGreaterThan(0);
    expect(typeof r?.costUsd).toBe("number");
    expect(r?.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result).toMatchObject({ scenario: "Test scenarios", model: "faux-a", passed: 1, total: 1 });
  });

  it("fails a step whose answer misses a fact, lists what was missed, and does not trust a grader's own pass", async () => {
    faux.setResponses([
      fauxAssistantMessage([fauxText(ANSWER)]),
      fauxAssistantMessage([fauxText(JSON.stringify({ pass: true, matched: [1], sourcesCited: true, visualMatches: true }))]),
    ]);

    const result = await run(scenarios(step()));

    expect(result.steps[0]?.grade).toMatchObject({
      pass: false,
      matchedFacts: ["WELL-0001 is not producing oil"],
      missedFacts: ["Latest inspection is INS-0001-0203"],
    });
    expect(result).toMatchObject({ passed: 0, total: 1 });
  });

  it("fails a step whose answer cites no sources or shows the wrong visual", async () => {
    faux.setResponses([
      fauxAssistantMessage([fauxText(ANSWER)]),
      fauxAssistantMessage([fauxText(verdict([1, 2], { sourcesCited: false }))]),
      fauxAssistantMessage([fauxText(ANSWER)]),
      fauxAssistantMessage([fauxText(verdict([1, 2], { visualMatches: false }))]),
    ]);

    const result = await run(scenarios(step({ id: "Q1" }), step({ id: "Q2", expectedVisual: "table" })));

    expect(result.steps.map((s) => s.grade.pass)).toEqual([false, false]);
    expect(result.steps[0]?.grade).toMatchObject({ sourcesCited: false, missedFacts: [] });
    expect(result.steps[1]?.grade).toMatchObject({ visualMatches: false, missedFacts: [] });
  });

  it("reads a grader verdict wrapped in a code fence, and fails the step when there is no verdict", async () => {
    faux.setResponses([
      fauxAssistantMessage([fauxText(ANSWER)]),
      fauxAssistantMessage([fauxText("```json\n" + verdict([1, 2]) + "\n```")]),
      fauxAssistantMessage([fauxText(ANSWER)]),
      fauxAssistantMessage([fauxText("I cannot decide.")]),
    ]);

    const result = await run(scenarios(step({ id: "Q1" }), step({ id: "Q2" })));

    expect(result.steps[0]?.grade.pass).toBe(true);
    expect(result.steps[1]?.grade).toMatchObject({ pass: false, comment: expect.stringContaining("grader") });
  });

  it("continues the user's latest chat for a continue step and opens a fresh one for a new step", async () => {
    const seen: string[] = [];
    const answer = (text: string) => (context: { messages: unknown[] }) => {
      seen.push(asSeen(context));
      return fauxAssistantMessage([fauxText(text)]);
    };
    const grade = fauxAssistantMessage([fauxText(verdict([1]))]);
    faux.setResponses([answer("first reply"), grade, answer("second reply"), grade, answer("third reply"), grade]);

    await run(
      scenarios(
        step({ id: "Q1", question: "first question", expectedFacts: ["a"] }),
        step({ id: "Q2", chat: "continue", question: "second question", expectedFacts: ["a"] }),
        step({ id: "Q3", chat: "new", question: "third question", expectedFacts: ["a"] }),
      ),
    );

    expect(seen[1]).toContain("first question");
    expect(seen[1]).toContain("first reply");
    // A new chat gets the digest of earlier answers, not their transcript.
    expect(seen[2]).not.toContain("first reply");
    expect(chatRequests[0]?.threadId).toBe(chatRequests[1]?.threadId);
    expect(chatRequests[2]?.threadId).not.toBe(chatRequests[0]?.threadId);
  });

  it("plays each step as its own user, with each user's own latest chat", async () => {
    faux.setResponses(Array.from({ length: 6 }, (_, i) => fauxAssistantMessage([fauxText(i % 2 ? verdict([1]) : ANSWER)])));

    await run(
      scenarios(
        step({ id: "Q1", user: "Michael Turner", expectedFacts: ["a"] }),
        step({ id: "Q2", user: "Jessica Reed", expectedFacts: ["a"] }),
        step({ id: "Q3", user: "Michael Turner", chat: "continue", expectedFacts: ["a"] }),
      ),
    );

    expect(chatRequests.map((r) => r.user)).toEqual(["U-201", "U-202", "U-201"]);
    expect(chatRequests[2]?.threadId).toBe(chatRequests[0]?.threadId);
    expect(chatRequests[1]?.threadId).not.toBe(chatRequests[0]?.threadId);
  });

  it("starts new chats on the model override, and records it", async () => {
    faux.setResponses([fauxAssistantMessage([fauxText(ANSWER)]), fauxAssistantMessage([fauxText(verdict([1, 2]))])]);

    const result = await run(scenarios(step()), { model: "faux-b" });

    expect(chatRequests[0]?.model).toBe("faux-b");
    expect(result.model).toBe("faux-b");
    expect(result.steps[0]?.model).toBe("faux-b");
  });

  it("refuses to start when a step names a user the fleet does not have", async () => {
    await expect(run(scenarios(step({ id: "Q9", user: "Nobody Real" })))).rejects.toThrow(/Q9.*Nobody Real/);
  });

  it("wipes chat-origin knowledge and earlier conversations before the first step, keeping dataset knowledge", async () => {
    replaceDatasetKnowledge(knowledgePath, [
      { note_id: "CTX-0001-003", asset_id: "WELL-0001", note_type: "operator_note", text: "Planned shut-in" },
    ]);
    addChatEntry(knowledgePath, {
      kind: "note",
      scope: "well",
      assetId: "WELL-0007",
      text: "Shut in from 17 Oct",
      authorUserId: "U-101",
      status: "accepted",
    });
    const earlier = openConversationStore(conversationsPath);
    const old = earlier.forUser("U-201").create({ title: "Leftover chat from a previous run", model: "faux-a" });
    earlier.forUser("U-201").recordDigest(old.id, { question: "leftover question", wells: [], areas: [], recordIds: [], summary: "leftover summary" });
    earlier.close();

    let seen = "";
    faux.setResponses([
      (context: { messages: unknown[] }) => {
        seen = asSeen(context);
        return fauxAssistantMessage([fauxText(ANSWER)]);
      },
      fauxAssistantMessage([fauxText(verdict([1, 2]))]),
    ]);
    await run(scenarios(step()));

    const db = openKnowledgeStore(knowledgePath);
    const left = (db.prepare("SELECT entry_id, origin FROM knowledge_entries").all() as Array<{ entry_id: string; origin: string }>);
    db.close();
    expect(left).toEqual([{ entry_id: "CTX-0001-003", origin: "dataset" }]);
    expect(seen).not.toContain("leftover");
  });

  it("records the answer without the tool results shown in the tool trace, and names the tools called", async () => {
    faux.setResponses([
      fauxAssistantMessage([fauxToolCall("ping", { message: "hello" }, { id: "call-1" })], { stopReason: "toolUse" }),
      fauxAssistantMessage([fauxText(ANSWER)]),
      fauxAssistantMessage([fauxText(verdict([1, 2]))]),
    ]);

    const result = await run(scenarios(step()));

    expect(result.steps[0]?.answer).toBe(ANSWER);
    expect(result.steps[0]?.toolCalls).toEqual(["ping"]);
  });

  it("fails a step whose chat errors without calling the grader, and goes on with the rest", async () => {
    faux.setResponses([
      fauxAssistantMessage([], { stopReason: "error", errorMessage: "Provider is down" }),
      fauxAssistantMessage([fauxText(ANSWER)]),
      fauxAssistantMessage([fauxText(verdict([1, 2]))]),
    ]);

    const result = await run(scenarios(step({ id: "Q1" }), step({ id: "Q2" })));

    expect(result.steps[0]).toMatchObject({ grade: { pass: false }, error: expect.stringContaining("Provider is down") });
    expect(result.steps[1]?.grade.pass).toBe(true);
    expect(result).toMatchObject({ passed: 1, total: 2 });
  });
});
