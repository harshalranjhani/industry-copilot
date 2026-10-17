import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { EvalRun, StepResult } from "./runner";
import { compareRuns, historyFileName, readEvalRuns, summarizeRun } from "./runs";

const result = (id: string, pass: boolean, costUsd: number, latencyMs: number): StepResult => ({
  step: { id, user: "Michael Turner", chat: "new", question: `Question ${id}?`, expectedFacts: ["a", "b"], expectedVisual: "none" },
  threadId: `thread-${id}`,
  answer: 'root = Stack([TextContent("hi")])',
  toolCalls: [],
  grade: { pass, matchedFacts: pass ? ["a", "b"] : ["a"], missedFacts: pass ? [] : ["b"], sourcesCited: true, visualMatches: true, comment: "" },
  model: "m/one",
  inputTokens: 10,
  outputTokens: 5,
  costUsd,
  latencyMs,
});

const run = (startedAt: string, model: string, steps: StepResult[]): EvalRun => ({
  scenario: "The 18 example questions",
  model,
  graderModel: "g/grader",
  startedAt,
  passed: steps.filter((s) => s.grade.pass).length,
  total: steps.length,
  steps,
});

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "eval-runs-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("readEvalRuns", () => {
  it("lists the runs in a results directory, newest first, each with an id to pick it by", () => {
    writeFileSync(join(dir, "results.json"), JSON.stringify(run("2026-10-16T08:00:00Z", "m/old", [result("Q1", true, 0.01, 1000)])));
    writeFileSync(join(dir, "results-claude.json"), JSON.stringify(run("2026-10-17T08:00:00Z", "m/new", [result("Q1", false, 0.02, 2000)])));

    const runs = readEvalRuns(dir);

    expect(runs.map((r) => [r.id, r.run.model])).toEqual([
      ["results-claude", "m/new"],
      ["results", "m/old"],
    ]);
  });

  it("ignores files that are not eval results, such as the scenario file or broken JSON", () => {
    writeFileSync(join(dir, "results.json"), JSON.stringify(run("2026-10-16T08:00:00Z", "m/one", [result("Q1", true, 0, 0)])));
    writeFileSync(join(dir, "example-questions.json"), JSON.stringify({ name: "scenarios", steps: [] }));
    writeFileSync(join(dir, "results-broken.json"), "{ nope");
    writeFileSync(join(dir, "notes.txt"), "hello");

    expect(readEvalRuns(dir).map((r) => r.id)).toEqual(["results"]);
  });

  it("returns no runs when the directory does not exist yet", () => {
    expect(readEvalRuns(join(dir, "missing"))).toEqual([]);
  });
});

describe("summarizeRun", () => {
  it("gives the pass rate, total cost and mean latency", () => {
    const summary = summarizeRun(
      run("2026-10-17T08:00:00Z", "m/one", [
        result("Q1", true, 0.01, 1000),
        result("Q2", false, 0.03, 3000),
        result("Q3", true, 0.02, 2000),
        result("Q4", true, 0.02, 2000),
      ]),
    );

    expect(summary).toEqual({ passed: 3, total: 4, passRate: 75, totalCostUsd: 0.08, meanLatencyMs: 2000 });
  });

  it("is all zeros for a run with no steps", () => {
    expect(summarizeRun(run("2026-10-17T08:00:00Z", "m/one", []))).toEqual({ passed: 0, total: 0, passRate: 0, totalCostUsd: 0, meanLatencyMs: 0 });
  });
});

describe("run history", () => {
  it("names a history file by start time, scenario and model", () => {
    expect(historyFileName(run("2026-10-17T09:47:48.043Z", "openai/gpt-6-luna", []))).toBe(
      "2026-10-17T0947-the-18-example-questions-openai-gpt-6-luna.json",
    );
  });

  it("reads the history folder too, listing a run kept in both places once", () => {
    const latest = run("2026-10-17T09:00:00Z", "m/new", [result("Q1", true, 0.01, 1000)]);
    mkdirSync(join(dir, "history"));
    writeFileSync(join(dir, "results.json"), JSON.stringify(latest));
    writeFileSync(join(dir, "history", "a.json"), JSON.stringify(latest));
    writeFileSync(join(dir, "history", "b.json"), JSON.stringify(run("2026-10-16T09:00:00Z", "m/old", [])));
    expect(readEvalRuns(dir).map((r) => r.id)).toEqual(["history/a", "history/b"]);
  });

  it("compares two runs step by step", () => {
    const before = run("2026-10-16T09:00:00Z", "m", [result("Q1", false, 0, 0), result("Q2", true, 0, 0), result("Q3", true, 0, 0)]);
    const after = run("2026-10-17T09:00:00Z", "m", [result("Q1", true, 0, 0), result("Q2", false, 0, 0), result("Q4", true, 0, 0)]);
    expect(compareRuns(before, after).map((r) => [r.id, r.change])).toEqual([
      ["Q1", "fixed"],
      ["Q2", "regressed"],
      ["Q4", "new"],
      ["Q3", "dropped"],
    ]);
  });
});
