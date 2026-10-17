import type { EvalRun, StepResult } from "./runner";

export const usd = (n: number) => `$${n.toFixed(4)}`;
export const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const mark = (ok: boolean) => (ok ? "yes" : "no");
const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s+/g, " ");

function detail(r: StepResult): string {
  const { step, grade } = r;
  return [
    `### ${step.id}: ${grade.pass ? "pass" : "fail"}`,
    "",
    `**${step.user}** (${step.chat === "new" ? "new chat" : "continued chat"}): ${step.question}`,
    "",
    `Expected visual: \`${step.expectedVisual}\` · matched: ${mark(grade.visualMatches)} · sources cited: ${mark(grade.sourcesCited)}`,
    "",
    ...(grade.matchedFacts.length ? ["Matched facts:", ...grade.matchedFacts.map((f) => `- ${f}`), ""] : []),
    ...(grade.missedFacts.length ? ["Missed facts:", ...grade.missedFacts.map((f) => `- ${f}`), ""] : []),
    ...(grade.comment ? [`Grader: ${grade.comment}`, ""] : []),
    ...(r.error ? [`Error: ${r.error}`, ""] : []),
    `Tools: ${r.toolCalls.length ? r.toolCalls.join(", ") : "none"} · ${r.model} · ${r.inputTokens.toLocaleString("en-US")} in / ${r.outputTokens.toLocaleString("en-US")} out · ${usd(r.costUsd)} · ${seconds(r.latencyMs)}`,
    "",
    "<details><summary>Answer (OpenUI Lang)</summary>",
    "",
    "```",
    r.answer.trim() || "(no answer)",
    "```",
    "",
    "</details>",
    "",
  ].join("\n");
}

/** The EVALS.md report: a summary table, then the details of every step. */
export function renderEvalsMarkdown(run: EvalRun): string {
  // A question with several steps (Q11 to Q18) passes only when all its steps do.
  const questions = new Map<string, boolean>();
  for (const r of run.steps) {
    const question = r.step.id.split(".")[0]!;
    questions.set(question, (questions.get(question) ?? true) && r.grade.pass);
  }
  const questionsPassed = [...questions.values()].filter(Boolean).length;
  const cost = run.steps.reduce((sum, r) => sum + r.costUsd, 0);
  const latency = run.steps.reduce((sum, r) => sum + r.latencyMs, 0);
  const rate = run.total ? Math.round((run.passed / run.total) * 100) : 0;
  return [
    "# Evals",
    "",
    `${run.scenario}, run ${run.startedAt} on \`${run.model}\`, graded by \`${run.graderModel}\`.`,
    "",
    `**Passed ${run.passed} of ${run.total} steps (${rate}%), ${questionsPassed} of ${questions.size} questions** · answer cost ${usd(cost)} · total answer time ${seconds(latency)}`,
    "",
    "| Step | User | Result | Facts | Sources | Visual | Tokens in / out | Cost | Time |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...run.steps.map((r) => {
      const facts = r.step.expectedFacts.length;
      return `| ${cell(r.step.id)} | ${cell(r.step.user)} | ${r.grade.pass ? "pass" : "fail"} | ${r.grade.matchedFacts.length}/${facts} | ${mark(r.grade.sourcesCited)} | ${mark(r.grade.visualMatches)} | ${r.inputTokens.toLocaleString("en-US")} / ${r.outputTokens.toLocaleString("en-US")} | ${usd(r.costUsd)} | ${seconds(r.latencyMs)} |`;
    }),
    "",
    "## Details",
    "",
    ...run.steps.map(detail),
  ].join("\n");
}
