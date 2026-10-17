import Link from "next/link";
import { join } from "node:path";
import type { EvalRun } from "@/lib/evals/runner";
import { seconds, usd } from "@/lib/evals/report";
import { readEvalRuns, summarizeRun } from "@/lib/evals/runs";
import { MODEL_ALLOWLIST } from "@/lib/models";
import { RunRows } from "./run-rows";

export const metadata = { title: "Evaluations · Asset Intelligence" };

export default async function EvalsPage({ searchParams }: { searchParams: Promise<{ run?: string | string[] }> }) {
  const runs = readEvalRuns(join(process.cwd(), "evals"));
  const wanted = (await searchParams).run;
  const selected = runs.find((r) => r.id === wanted) ?? runs[0];

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
                <h3>Saved runs <span>{runs.length}</span></h3>
                <nav aria-label="Eval runs">
                  {runs.map(({ id, run }) => (
                    <Link
                      key={id}
                      href={`/evals?run=${encodeURIComponent(id)}`}
                      scroll={false}
                      aria-current={id === selected.id ? "page" : undefined}
                      className="evals-run-link"
                    >
                      <span>{MODEL_ALLOWLIST.find((m) => m.id === run.model)?.name ?? run.model}</span>
                      <time dateTime={run.startedAt}>
                        {new Date(run.startedAt).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC
                      </time>
                      <span className="evals-run-count">{run.steps.length} steps</span>
                    </Link>
                  ))}
                </nav>
              </aside>
              <div className="evals-results">
                <Summary run={selected.run} />
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
