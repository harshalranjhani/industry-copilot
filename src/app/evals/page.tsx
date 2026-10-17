import Link from "next/link";
import { join } from "node:path";
import type { EvalRun } from "@/lib/evals/runner";
import { seconds, usd } from "@/lib/evals/report";
import { type SavedRun, compareRuns, readEvalRuns, summarizeRun } from "@/lib/evals/runs";
import { MODEL_ALLOWLIST } from "@/lib/models";
import { RunRows } from "./run-rows";

export const metadata = { title: "Evaluations · Asset Intelligence" };

const modelName = (id: string) => MODEL_ALLOWLIST.find((m) => m.id === id)?.name ?? id;
const when = (startedAt: string) =>
  `${new Date(startedAt).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC`;
const runHref = (run: string, compare?: string) =>
  `/evals?run=${encodeURIComponent(run)}${compare ? `&compare=${encodeURIComponent(compare)}` : ""}`;

/** Runs grouped by scenario set, each group newest first, groups by their newest run. */
function byScenario(runs: SavedRun[]): [string, SavedRun[]][] {
  const groups = new Map<string, SavedRun[]>();
  for (const saved of runs) groups.set(saved.run.scenario, [...(groups.get(saved.run.scenario) ?? []), saved]);
  return [...groups];
}

export default async function EvalsPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string | string[]; compare?: string | string[] }>;
}) {
  const runs = readEvalRuns(join(process.cwd(), "evals"));
  const params = await searchParams;
  const selected = runs.find((r) => r.id === params.run) ?? runs[0];
  const compared = runs.find((r) => r.id === params.compare && r.id !== selected?.id);
  const groups = byScenario(runs);

  return (
    <div className="copilot-app evals-page flex h-dvh w-full flex-col overflow-hidden">
      <header className="copilot-header">
        <div className="copilot-brand">
          <svg className="copilot-brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M7 23V14M16 23V9M25 23V5M5 27h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <h1>Asset Intelligence</h1>
            <p>Evaluation workspace</p>
          </div>
        </div>
        <Link href="/" className="copilot-link">
          <span aria-hidden="true">←</span> Back to chat
        </Link>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="evals-content">
          <div className="evals-heading">
            <span className="copilot-eyebrow">Quality &amp; performance</span>
            <h2>Evaluations</h2>
            <p>See how the copilot answers, where it falls short, and what each run costs.</p>
          </div>
          {!selected ? (
            <div className="evals-empty">
              <h3>Your first benchmark starts here.</h3>
              <p>Run the example questions to review answer quality, source citations, and performance.</p>
              <code>pnpm eval</code>
              <p>Saved runs will appear here when they finish.</p>
            </div>
          ) : (
            <div className="evals-layout">
              <aside className="evals-runs">
                <h3>Run history <span>{runs.length}</span></h3>
                {groups.map(([scenario, group]) => (
                  <section key={scenario} className="evals-run-group" aria-label={scenario}>
                    <h4>{scenario}</h4>
                    <Trend runs={group} selectedId={selected.id} />
                    <nav aria-label={`${scenario} runs`}>
                      {group.map(({ id, run }) => {
                        const s = summarizeRun(run);
                        return (
                          <Link
                            key={id}
                            href={runHref(id)}
                            scroll={false}
                            aria-current={id === selected.id ? "page" : undefined}
                            className="evals-run-link"
                          >
                            <span className="evals-run-title">
                              {modelName(run.model)}
                              <span className={`evals-badge ${s.passed === s.total ? "evals-badge--pass" : "evals-badge--neutral"}`}>
                                {s.passed}/{s.total}
                              </span>
                            </span>
                            <time dateTime={run.startedAt}>{when(run.startedAt)}</time>
                            <span className="evals-run-count">graded by {modelName(run.graderModel)}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </section>
                ))}
              </aside>
              <div className="evals-results">
                <Summary run={selected.run} />
                <CompareControls runs={runs} selected={selected} compared={compared} />
                {compared && <Comparison before={compared} after={selected} />}
                <section aria-labelledby="evals-steps-heading">
                  <div className="evals-section-heading">
                    <h3 id="evals-steps-heading">Step results</h3>
                    <p>Expand a step to inspect its facts, grading, and answer.</p>
                  </div>
                  <RunRows key={selected.id} steps={selected.run.steps} />
                </section>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/** Pass rate of each run in a scenario set, oldest to newest, as a row of bars. */
function Trend({ runs, selectedId }: { runs: SavedRun[]; selectedId: string }) {
  if (runs.length < 2) return null;
  const ordered = [...runs].reverse();
  return (
    <div className="evals-trend" role="img" aria-label={`Pass rate over ${runs.length} runs: ${ordered.map((r) => `${summarizeRun(r.run).passRate}%`).join(", ")}`}>
      {ordered.map(({ id, run }) => {
        const s = summarizeRun(run);
        return (
          <Link key={id} href={runHref(id)} scroll={false} title={`${when(run.startedAt)} · ${modelName(run.model)} · ${s.passed}/${s.total}`}>
            <span style={{ height: `${Math.max(6, s.passRate)}%` }} data-current={id === selectedId || undefined} />
          </Link>
        );
      })}
    </div>
  );
}

/** Pick an earlier run to compare against: runs of the same scenario set first. */
function CompareControls({ runs, selected, compared }: { runs: SavedRun[]; selected: SavedRun; compared?: SavedRun }) {
  const others = runs
    .filter((r) => r.id !== selected.id)
    .sort((a, b) => Number(b.run.scenario === selected.run.scenario) - Number(a.run.scenario === selected.run.scenario));
  if (others.length === 0) return null;
  return (
    <section className="evals-compare-controls" aria-label="Compare runs">
      <span>Compare with</span>
      {others.slice(0, 6).map(({ id, run }) => (
        <Link key={id} href={runHref(selected.id, id)} scroll={false} className="evals-chip" aria-current={id === compared?.id ? "true" : undefined}>
          {modelName(run.model)} · {when(run.startedAt)}
          {run.scenario !== selected.run.scenario && <small> · other set</small>}
        </Link>
      ))}
      {compared && (
        <Link href={runHref(selected.id)} scroll={false} className="evals-chip evals-chip--clear">
          Clear
        </Link>
      )}
    </section>
  );
}

const CHANGE_LABEL = {
  fixed: "Fixed",
  regressed: "Regressed",
  "still passing": "Still passing",
  "still failing": "Still failing",
  new: "New step",
  dropped: "Not in this run",
} as const;

function Comparison({ before, after }: { before: SavedRun; after: SavedRun }) {
  const rows = compareRuns(before.run, after.run);
  const [a, b] = [summarizeRun(before.run), summarizeRun(after.run)];
  const delta = (n: number, unit = "") => `${n > 0 ? "+" : ""}${n}${unit}`;
  const count = (change: keyof typeof CHANGE_LABEL) => rows.filter((r) => r.change === change).length;
  return (
    <section className="evals-comparison" aria-labelledby="evals-compare-heading">
      <div className="evals-section-heading">
        <h3 id="evals-compare-heading">This run against {modelName(before.run.model)}, {when(before.run.startedAt)}</h3>
        <p>
          Pass rate {a.passRate}% → {b.passRate}% ({delta(b.passRate - a.passRate, " pts")}) · {count("fixed")} fixed ·{" "}
          {count("regressed")} regressed · cost {usd(a.totalCostUsd)} → {usd(b.totalCostUsd)} · latency {seconds(a.meanLatencyMs)} →{" "}
          {seconds(b.meanLatencyMs)}
        </p>
      </div>
      <table className="evals-compare-table">
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col">Question</th>
            <th scope="col">Before</th>
            <th scope="col">After</th>
            <th scope="col">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} data-change={r.change}>
              <th scope="row">{r.id}</th>
              <td>{r.question}</td>
              <td>{r.before === undefined ? "–" : r.before ? "Pass" : "Fail"}</td>
              <td>{r.after === undefined ? "–" : r.after ? "Pass" : "Fail"}</td>
              <td>
                <span className={`evals-change evals-change--${r.change.replace(" ", "-")}`}>{CHANGE_LABEL[r.change]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Summary({ run }: { run: EvalRun }) {
  const s = summarizeRun(run);
  const tiles = [
    ["Pass rate", `${s.passRate}%`, `${s.passed} of ${s.total} steps passed`],
    ["Answer cost", usd(s.totalCostUsd), "Total across this run"],
    ["Average latency", seconds(s.meanLatencyMs), "Response time per step"],
  ];
  return (
    <section aria-label="Run summary">
      <dl className="evals-stats">
        {tiles.map(([label, value, description]) => (
          <div key={label} className="evals-stat">
            <dt>{label}</dt>
            <dd>{value}<span>{description}</span></dd>
          </div>
        ))}
      </dl>
      <dl className="evals-context">
        <div><dt>Scenario</dt><dd>{run.scenario}</dd></div>
        <div><dt>Answer model</dt><dd><code>{run.model}</code></dd></div>
        <div><dt>Grader model</dt><dd><code>{run.graderModel}</code></dd></div>
      </dl>
    </section>
  );
}
