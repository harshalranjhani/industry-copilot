import Link from "next/link";
import { join } from "node:path";
import type { EvalRun } from "@/lib/evals/runner";
import { seconds, usd } from "@/lib/evals/report";
import { readEvalRuns, summarizeRun } from "@/lib/evals/runs";
import { RunRows } from "./run-rows";


export const metadata = { title: "Evals · Asset Intelligence Copilot" };

export default async function EvalsPage({ searchParams }: { searchParams: Promise<{ run?: string | string[] }> }) {
  const runs = readEvalRuns(join(process.cwd(), "evals"));
  const wanted = (await searchParams).run;
  const selected = runs.find((r) => r.id === wanted) ?? runs[0];

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-black/10 px-4 py-2 dark:border-white/15">
        <span className="text-sm font-semibold">Asset Intelligence Copilot · Evals</span>
        <Link href="/" className="text-sm underline">
          Back to chat
        </Link>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        {!selected ? (
          <p className="text-sm opacity-70">
            No eval runs yet. Run <code>pnpm eval</code> to replay the example questions and write <code>evals/results.json</code>.
          </p>
        ) : (
          <div className="mx-auto flex max-w-5xl flex-col gap-4">
            <nav aria-label="Eval runs" className="flex flex-wrap gap-2">
              {runs.map(({ id, run }) => (
                <Link
                  key={id}
                  href={`/evals?run=${encodeURIComponent(id)}`}
                  aria-current={id === selected.id ? "page" : undefined}
                  className={`rounded-md border px-3 py-1 text-sm ${id === selected.id ? "border-current font-semibold" : "border-black/20 opacity-70 dark:border-white/25"}`}
                >
                  {run.model} · {new Date(run.startedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC
                </Link>
              ))}
            </nav>
            <Summary run={selected.run} />
            <RunRows steps={selected.run.steps} />
          </div>
        )}
      </main>
    </div>
  );
}

function Summary({ run }: { run: EvalRun }) {
  const s = summarizeRun(run);
  const tiles = [
    ["Pass rate", `${s.passRate}% (${s.passed} of ${s.total})`],
    ["Total cost", usd(s.totalCostUsd)],
    ["Mean latency", seconds(s.meanLatencyMs)],
  ];
  return (
    <section aria-label="Run summary" className="flex flex-wrap items-end gap-6">
      {tiles.map(([label, value]) => (
        <div key={label}>
          <div className="text-xs uppercase tracking-wide opacity-60">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      ))}
      <p className="text-xs opacity-60">
        {run.scenario} · answered by <code>{run.model}</code> · graded by <code>{run.graderModel}</code>
      </p>
    </section>
  );
}
