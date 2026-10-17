import { readFileSync } from "node:fs";

/** The visual a question asks for, or the one that fits its answer; "none" when no visual is needed. */
export const EXPECTED_VISUALS = [
  "none",
  "card",
  "table",
  "line_chart",
  "area_chart",
  "bar_chart",
  "scatter_chart",
  "timeline",
  "map",
  "heatmap",
] as const;
export type ExpectedVisual = (typeof EXPECTED_VISUALS)[number];

/** Whether a step opens a new chat or carries on the user's most recent one. */
export const CHAT_MARKERS = ["new", "continue"] as const;
export type ChatMarker = (typeof CHAT_MARKERS)[number];

export interface ScenarioStep {
  /** Unique within the file, e.g. "Q12.2". */
  id: string;
  /** The person asking, by name (or user ID) from the fleet's user list. */
  user: string;
  chat: ChatMarker;
  question: string;
  /** What a correct answer must state; each is judged separately. */
  expectedFacts: string[];
  expectedVisual: ExpectedVisual;
}

export interface ScenarioFile {
  name: string;
  /** Played in this order: later steps may build on what earlier ones taught the copilot. */
  steps: ScenarioStep[];
}

/** Reads and validates a scenario file; throws naming the step that is wrong. */
export function loadScenarios(path: string): ScenarioFile {
  const raw = JSON.parse(readFileSync(path, "utf8")) as { name?: unknown; steps?: unknown };
  if (typeof raw.name !== "string" || !Array.isArray(raw.steps)) {
    throw new Error(`${path}: a scenario file needs a "name" and a "steps" list`);
  }
  const seen = new Set<string>();
  const usersWithChat = new Set<string>();
  const steps = raw.steps.map((candidate, index): ScenarioStep => {
    const s = (candidate ?? {}) as Record<string, unknown>;
    const id = typeof s.id === "string" && s.id ? s.id : `step ${index + 1}`;
    const bad = (field: string, expected: string) => new Error(`${path}: ${id}: "${field}" must be ${expected}`);

    if (typeof s.user !== "string" || !s.user) throw bad("user", "a user name");
    if (typeof s.question !== "string" || !s.question) throw bad("question", "the question text");
    if (!CHAT_MARKERS.includes(s.chat as ChatMarker)) throw bad("chat", `one of ${CHAT_MARKERS.join(", ")}`);
    if (!Array.isArray(s.expectedFacts) || s.expectedFacts.some((f) => typeof f !== "string" || !f)) {
      throw bad("expectedFacts", "a list of fact texts");
    }
    if (!EXPECTED_VISUALS.includes(s.expectedVisual as ExpectedVisual)) {
      throw bad("expectedVisual", `one of ${EXPECTED_VISUALS.join(", ")}`);
    }
    if (seen.has(id)) throw new Error(`${path}: step ${id} appears twice`);
    seen.add(id);
    if (s.chat === "continue" && !usersWithChat.has(s.user)) {
      throw new Error(`${path}: ${id} continues a chat, but ${s.user} has no earlier chat`);
    }
    usersWithChat.add(s.user);

    return {
      id,
      user: s.user,
      chat: s.chat as ChatMarker,
      question: s.question,
      expectedFacts: s.expectedFacts as string[],
      expectedVisual: s.expectedVisual as ExpectedVisual,
    };
  });
  return { name: raw.name, steps };
}
