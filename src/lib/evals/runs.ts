import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { EvalRun } from "./runner";

/** A saved run with the ID to pick it by: its results file name without the extension. */
export interface SavedRun {
  id: string;
  run: EvalRun;
}

export interface RunSummary {
  passed: number;
  total: number;
  /** Whole percent of steps passed. */
  passRate: number;
  totalCostUsd: number;
  meanLatencyMs: number;
}

const isEvalRun = (value: unknown): value is EvalRun => {
  const run = value as Partial<EvalRun> | null;
  return !!run && typeof run === "object" && typeof run.startedAt === "string" && typeof run.model === "string" && Array.isArray(run.steps);
};

/** Where every run keeps a copy, under the results directory, so later runs never replace earlier ones. */
export const HISTORY_DIR = "history";

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/** The history file of a run: when it started, the scenario set and the answer model, e.g. "2026-10-17T0947-the-18-example-questions-openai-gpt-6-luna.json". */
export function historyFileName(run: EvalRun): string {
  const at = run.startedAt.slice(0, 16).replace(/:/g, "");
  return `${at}-${slug(run.scenario)}-${slug(run.model)}.json`;
}

function readRunFiles(dir: string, idPrefix: string): SavedRun[] {
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const runs: SavedRun[] = [];
  for (const file of files) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(join(dir, file), "utf8"));
      if (isEvalRun(parsed)) runs.push({ id: `${idPrefix}${file.slice(0, -".json".length)}`, run: parsed });
    } catch {
      // not valid JSON: not a results file
    }
  }
  return runs;
}

/**
 * Reads every eval results file in a directory and its history folder (the
 * runner's `--results` outputs and their kept copies), newest run first. A run
 * found in both places is listed once, by its history copy. Other files are skipped.
 */
export function readEvalRuns(dir: string): SavedRun[] {
  const seen = new Set<string>();
  const runs: SavedRun[] = [];
  for (const saved of [...readRunFiles(join(dir, HISTORY_DIR), `${HISTORY_DIR}/`), ...readRunFiles(dir, "")]) {
    const key = `${saved.run.startedAt}|${saved.run.model}|${saved.run.scenario}`;
    if (seen.has(key)) continue;
    seen.add(key);
    runs.push(saved);
  }
  return runs.sort((a, b) => b.run.startedAt.localeCompare(a.run.startedAt));
}

export type StepChange = "fixed" | "regressed" | "still passing" | "still failing" | "new" | "dropped";

export interface StepComparison {
  id: string;
  question: string;
  /** Undefined when the step is not in that run. */
  before?: boolean;
  after?: boolean;
  change: StepChange;
}

/** Step-by-step pass/fail of two runs, matched by step ID, in the newer run's order (steps only the older run had come last). */
export function compareRuns(before: EvalRun, after: EvalRun): StepComparison[] {
  const old = new Map(before.steps.map((s) => [s.step.id, s]));
  const rows: StepComparison[] = after.steps.map((s) => {
    const prev = old.get(s.step.id);
    const now = s.grade.pass;
    const change: StepChange = !prev
      ? "new"
      : prev.grade.pass === now
        ? now ? "still passing" : "still failing"
        : now ? "fixed" : "regressed";
    return { id: s.step.id, question: s.step.question, before: prev?.grade.pass, after: now, change };
  });
  const current = new Set(after.steps.map((s) => s.step.id));
  for (const s of before.steps) {
    if (!current.has(s.step.id)) rows.push({ id: s.step.id, question: s.step.question, before: s.grade.pass, change: "dropped" });
  }
  return rows;
}

/** The totals shown above a run's rows. */
export function summarizeRun(run: EvalRun): RunSummary {
  const total = run.steps.length;
  const passed = run.steps.filter((s) => s.grade.pass).length;
  const cost = run.steps.reduce((sum, s) => sum + s.costUsd, 0);
  const latency = run.steps.reduce((sum, s) => sum + s.latencyMs, 0);
  return {
    passed,
    total,
    passRate: total ? Math.round((passed / total) * 100) : 0,
    totalCostUsd: Math.round(cost * 1e6) / 1e6,
    meanLatencyMs: total ? Math.round(latency / total) : 0,
  };
}
