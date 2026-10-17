import { existsSync, rmSync } from "node:fs";
import { USER_HEADER } from "@/lib/conversations/identity";
import { clearChatKnowledge } from "@/lib/data/knowledge";
import { MODEL_HEADER } from "@/lib/models";
import { type Grade, type GraderOptions, failed, gradeAnswer } from "./grader";
import type { ScenarioFile, ScenarioStep } from "./scenarios";

/** One played step: what the copilot answered, how it was graded and what it cost. */
export interface StepResult {
  step: ScenarioStep;
  threadId: string;
  /** The answer as the chat streamed it: OpenUI Lang. */
  answer: string;
  toolCalls: string[];
  /** Set when the chat itself failed; the step is then failed without grading. */
  error?: string;
  grade: Grade;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
}

export interface EvalRun {
  scenario: string;
  /** The model the copilot answered with: the override, else the default. */
  model: string;
  graderModel: string;
  startedAt: string;
  passed: number;
  total: number;
  steps: StepResult[];
}

export interface EvalOptions {
  scenarios: ScenarioFile;
  /** Starts every new chat on this model instead of the default. */
  model?: string;
  defaultModelId: string;
  /** The files an earlier run (or a person using the app) left behind; both are reset before the first step. */
  stores: { knowledgePath: string; conversationsPath: string };
  /** Opens the same chat route the UI posts to. Called after the reset, so it sees the clean stores. */
  openChat: () => { chat: (req: Request) => Promise<Response>; close?: () => void };
  /** A user's ID from their name (or ID); undefined when the fleet has no such person. */
  resolveUser: (name: string) => string | undefined;
  grader: GraderOptions;
}

interface ChatChunk {
  choices?: Array<{ delta?: { role?: string; content?: string; tool_calls?: Array<{ function?: { name?: string } }> } }>;
  usage?: { model: string; inputTokens: number; outputTokens: number; costUsd: number; latencyMs: number };
}

/**
 * A failed answer the chat route turns into an OpenUI error callout, e.g. a model outage.
 * Matched by the route's own titles: an answer may use an error callout itself (a breached SOP duty).
 */
const ERROR_NOTICE = /Callout\("error", "(Model error|Agent error)", "((?:[^"\\]|\\.)*)"\)/;

/** Posts one question to the chat route and collects the streamed answer. */
async function ask(
  chat: (req: Request) => Promise<Response>,
  userId: string,
  threadId: string,
  question: string,
  model: string | undefined,
): Promise<{ answer: string; toolCalls: string[]; usage?: ChatChunk["usage"]; error?: string }> {
  const res = await chat(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", [USER_HEADER]: userId, ...(model && { [MODEL_HEADER]: model }) },
      body: JSON.stringify({ threadId, messages: [{ role: "user", content: question }] }),
    }),
  );
  const text = await res.text();
  if (!res.ok) {
    const message = (() => {
      try {
        return (JSON.parse(text) as { error?: string }).error;
      } catch {
        return undefined;
      }
    })();
    return { answer: "", toolCalls: [], error: message ?? `Chat route answered ${res.status}` };
  }
  let answer = "";
  const toolCalls: string[] = [];
  let usage: ChatChunk["usage"];
  for (const line of text.split("\n").filter((l) => l.trim())) {
    const chunk = JSON.parse(line) as ChatChunk;
    // A "tool" delta carries a tool result for the trace, not part of the answer.
    if (chunk.choices?.[0]?.delta?.role !== "tool") answer += chunk.choices?.[0]?.delta?.content ?? "";
    for (const call of chunk.choices?.[0]?.delta?.tool_calls ?? []) if (call.function?.name) toolCalls.push(call.function.name);
    if (chunk.usage) usage = chunk.usage;
  }
  const notice = ERROR_NOTICE.exec(answer);
  return { answer, toolCalls, usage, error: notice ? `${notice[1]}: ${notice[2]}` : undefined };
}

/** Deletes the conversation file with its journal files, so the next open starts empty. */
function removeConversationFile(path: string): void {
  for (const file of [path, `${path}-wal`, `${path}-shm`, `${path}-journal`]) if (existsSync(file)) rmSync(file);
}

/**
 * Replays the scenario steps in order through the real chat route, as the right
 * users, in new or continued chats, and has the grader model judge each answer.
 * Chat-origin knowledge and conversations are reset first, so a run starts from the dataset alone.
 */
export async function runEvals(options: EvalOptions): Promise<EvalRun> {
  const { scenarios, model, defaultModelId, stores, openChat, resolveUser, grader } = options;
  const startedAt = new Date().toISOString();

  const userIds = new Map(
    scenarios.steps.map((step) => {
      const userId = resolveUser(step.user);
      if (!userId) throw new Error(`${step.id}: the fleet has no user "${step.user}"`);
      return [step.user, userId] as const;
    }),
  );

  clearChatKnowledge(stores.knowledgePath);
  removeConversationFile(stores.conversationsPath);

  const { chat, close } = openChat();
  const results: StepResult[] = [];
  try {
    const latestThread = new Map<string, string>();
    for (const step of scenarios.steps) {
      const userId = userIds.get(step.user)!;
      const threadId = step.chat === "continue" ? latestThread.get(userId) ?? crypto.randomUUID() : crypto.randomUUID();
      latestThread.set(userId, threadId);

      const startedStep = performance.now();
      const { answer, toolCalls, usage, error } = await ask(chat, userId, threadId, step.question, model);
      const grade: Grade = error
        ? failed(step, error)
        : await gradeAnswer(grader, step, answer);
      results.push({
        step,
        threadId,
        answer,
        toolCalls,
        ...(error && { error }),
        grade,
        model: usage?.model ?? model ?? defaultModelId,
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        costUsd: usage?.costUsd ?? 0,
        latencyMs: usage?.latencyMs ?? Math.round(performance.now() - startedStep),
      });
    }
  } finally {
    close?.();
  }

  return {
    scenario: scenarios.name,
    model: model ?? defaultModelId,
    graderModel: grader.model.id,
    startedAt,
    passed: results.filter((r) => r.grade.pass).length,
    total: results.length,
    steps: results,
  };
}
