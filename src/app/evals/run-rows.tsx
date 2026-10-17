"use client";

import { Renderer } from "@openuidev/react-lang";
import { ThemeProvider, useSystemThemeMode } from "@openuidev/react-ui";
import { useState } from "react";
import { seconds, usd } from "@/lib/evals/report";
import type { StepResult } from "@/lib/evals/runner";
import { copilotLibrary } from "@/lib/openui/library";

/** Native disclosure rows keep the results readable and keyboard-accessible at any width. */
export function RunRows({ steps }: { steps: StepResult[] }) {
  const mode = useSystemThemeMode();
  return (
    <ThemeProvider
      mode={mode}
      lightTheme={{ background: "var(--copilot-background)", foreground: "var(--copilot-surface)", textBrand: "var(--copilot-accent)" }}
    >
      <div className="evals-steps">
        {steps.length === 0 && <p className="evals-empty">No step results in this run yet.</p>}
        {steps.map((r) => <StepRow key={r.step.id} r={r} />)}
      </div>
    </ThemeProvider>
  );
}

function StepRow({ r }: { r: StepResult }) {
  const { step, grade } = r;
  const [expanded, setExpanded] = useState(false);
  return (
    <details name="eval-steps" className="evals-step" onToggle={(event) => setExpanded(event.currentTarget.open)}>
      <summary className="evals-step-summary">
        <span className="evals-step-id">{step.id}</span>
        <span className="evals-step-question">{step.question}<code>{r.model}</code></span>
        <span className={`evals-badge ${grade.pass ? "evals-badge--pass" : "evals-badge--fail"}`}>
          {grade.pass ? "Passed" : "Failed"}
        </span>
        <span className="evals-step-metrics">
          <span><small>Facts</small>{grade.matchedFacts.length}/{step.expectedFacts.length}</span>
          <span><small>Cost</small>{usd(r.costUsd)}</span>
          <span><small>Latency</small>{seconds(r.latencyMs)}</span>
        </span>
        <svg className="evals-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      {expanded && (
        <div className="evals-step-details">
          <dl className="evals-context">
            <div><dt>Profile</dt><dd>{step.user}</dd></div>
            <div><dt>Conversation</dt><dd>{step.chat === "new" ? "New chat" : "Continued chat"}</dd></div>
            <div><dt>Expected visual</dt><dd>{step.expectedVisual} · {grade.visualMatches ? "matched" : "not matched"}</dd></div>
            <div><dt>Sources</dt><dd>{grade.sourcesCited ? "Cited" : "Not cited"}</dd></div>
          </dl>
          <div className="evals-facts">
            <FactList title="Expected facts" facts={step.expectedFacts} empty="No expected facts." />
            <FactList title="Matched facts" facts={grade.matchedFacts} empty="None matched." />
            <FactList title="Missed facts" facts={grade.missedFacts} empty="None missed." />
          </div>
          {r.error && <p role="alert" className="evals-error">Error: {r.error}</p>}
          {grade.comment && <div className="evals-grader"><h4>Grader notes</h4><p>{grade.comment}</p></div>}
          <div className="evals-answer">
            <h4>Copilot answer</h4>
            {r.answer.trim() ? (
              <Renderer response={r.answer} library={copilotLibrary} isStreaming={false} />
            ) : (
              <p className="evals-muted">No answer was returned for this step.</p>
            )}
          </div>
        </div>
      )}
    </details>
  );
}

function FactList({ title, facts, empty }: { title: string; facts: string[]; empty: string }) {
  return (
    <div className="evals-fact-list">
      <h4>{title}</h4>
      {facts.length ? (
        <ul>
          {facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      ) : (
        <p className="evals-muted">{empty}</p>
      )}
    </div>
  );
}
