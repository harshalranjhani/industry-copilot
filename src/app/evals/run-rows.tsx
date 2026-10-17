"use client";

import { Renderer } from "@openuidev/react-lang";
import { useState } from "react";
import type { StepResult } from "@/lib/evals/runner";
import { copilotLibrary } from "@/lib/openui/library";

const usd = (n: number) => `$${n.toFixed(4)}`;
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

/** One row per question step; a row opens to its expected, matched and missed facts and the answer as the chat rendered it. */
export function RunRows({ steps }: { steps: StepResult[] }) {
  const [open, setOpen] = useState<string>();
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase opacity-60">
        <tr>
          <th className="py-2">Step</th>
          <th>Question</th>
          <th>Result</th>
          <th>Facts</th>
          <th>Model</th>
          <th className="text-right">Cost</th>
          <th className="text-right">Latency</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((r) => {
          const expanded = open === r.step.id;
          return (
            <StepRow key={r.step.id} r={r} expanded={expanded} toggle={() => setOpen(expanded ? undefined : r.step.id)} />
          );
        })}
      </tbody>
    </table>
  );
}

function StepRow({ r, expanded, toggle }: { r: StepResult; expanded: boolean; toggle: () => void }) {
  const { step, grade } = r;
  return (
    <>
      <tr className="cursor-pointer border-t border-black/10 align-top dark:border-white/15" onClick={toggle}>
        <td className="py-2 pr-2 font-mono">
          <button type="button" aria-expanded={expanded} className="underline" onClick={toggle}>
            {step.id}
          </button>
        </td>
        <td className="pr-2">{step.question}</td>
        <td className={`pr-2 font-semibold ${grade.pass ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
          {grade.pass ? "pass" : "fail"}
        </td>
        <td className="pr-2">
          {grade.matchedFacts.length}/{step.expectedFacts.length}
        </td>
        <td className="pr-2 font-mono text-xs">{r.model}</td>
        <td className="text-right">{usd(r.costUsd)}</td>
        <td className="text-right">{seconds(r.latencyMs)}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="pb-4">
            <div className="flex flex-col gap-4 rounded-md border border-black/10 p-4 dark:border-white/15">
              <p className="text-xs opacity-70">
                {step.user} · {step.chat === "new" ? "new chat" : "continued chat"} · expected visual {step.expectedVisual} (matched:{" "}
                {grade.visualMatches ? "yes" : "no"}) · sources cited: {grade.sourcesCited ? "yes" : "no"}
              </p>
              <FactList title="Expected facts" facts={step.expectedFacts} />
              <FactList title="Missed facts" facts={grade.missedFacts} empty="None missed." />
              {r.error && <p className="text-sm text-red-700 dark:text-red-400">Error: {r.error}</p>}
              {grade.comment && <p className="text-sm">Grader: {grade.comment}</p>}
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase opacity-70">Answer</h3>
                {r.answer.trim() ? <Renderer response={r.answer} library={copilotLibrary} isStreaming={false} /> : <p className="text-sm opacity-70">(no answer)</p>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function FactList({ title, facts, empty }: { title: string; facts: string[]; empty?: string }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase opacity-70">{title}</h3>
      {facts.length ? (
        <ul className="list-disc pl-5 text-sm">
          {facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm opacity-70">{empty}</p>
      )}
    </div>
  );
}
