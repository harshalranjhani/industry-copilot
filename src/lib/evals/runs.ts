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

/** Reads every eval results file in a directory (the runner's `--results` outputs), newest run first. Other files are skipped. */
export function readEvalRuns(dir: string): SavedRun[] {
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
      if (isEvalRun(parsed)) runs.push({ id: file.slice(0, -".json".length), run: parsed });
    } catch {
      // not valid JSON: not a results file
    }
  }
  return runs.sort((a, b) => b.run.startedAt.localeCompare(a.run.startedAt));
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
