"use client";

import { createParser } from "@openuidev/react-lang";
import { type RefObject, useMemo, useState } from "react";
import { EXPORT_SKIP_ATTRIBUTE, downloadAnswerCsv, downloadAnswerPdf } from "@/lib/openui/answer-export";
import { copilotLibrary } from "@/lib/openui/app-library";
import { extractAnswerData } from "@/lib/openui/export-data";

let parser: ReturnType<typeof createParser> | undefined;
const parseAnswer = (content: string) => {
  parser ??= createParser(copilotLibrary.toJSONSchema(), copilotLibrary.root);
  return parser.parse(content).root;
};

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const DOWNLOAD = "M10 3v10m0 0-4-4m4 4 4-4M4 16h12";
const TABLE = "M3 5h14v10H3zM3 9h14M8 5v10";
const COPY = "M7 7h9v9H7zM4 13V4h9";
const CHECK = "m5 10 3 3 7-7";

type Busy = "pdf" | "csv" | "copy" | null;

/**
 * Under each finished answer: download it as a PDF (the answer drawn light, then
 * its data tables and sources), its data as CSV, or copy its text.
 */
export function AnswerActions({
  content,
  question,
  meta,
  answerRef,
}: {
  content: string;
  question?: string;
  meta: string[];
  answerRef: RefObject<HTMLElement | null>;
}) {
  const data = useMemo(() => extractAnswerData(parseAnswer(content)), [content]);
  const [busy, setBusy] = useState<Busy>(null);
  const [done, setDone] = useState<Busy>(null);
  const [error, setError] = useState<string>();

  const run = (kind: Exclude<Busy, null>, task: () => Promise<void> | void) => async () => {
    setBusy(kind);
    setError(undefined);
    try {
      await task();
      setDone(kind);
      setTimeout(() => setDone((d) => (d === kind ? null : d)), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const pdf = run("pdf", () => downloadAnswerPdf({ content, data, question, meta }));
  const csv = run("csv", () => downloadAnswerCsv(data));
  const copy = run("copy", async () => {
    await navigator.clipboard.writeText(answerRef.current?.innerText.trim() ?? "");
  });

  return (
    <div className="copilot-answer-actions" {...{ [EXPORT_SKIP_ATTRIBUTE]: "" }}>
      <button type="button" onClick={pdf} disabled={busy !== null} title="Download this answer, its data and sources as a PDF">
        <Icon d={done === "pdf" ? CHECK : DOWNLOAD} />
        {busy === "pdf" ? "Preparing PDF…" : "PDF"}
      </button>
      {data.tables.length > 0 && (
        <button
          type="button"
          onClick={csv}
          disabled={busy !== null}
          title={`Download the data behind this answer (${data.tables.length} ${data.tables.length === 1 ? "table" : "tables"}) as CSV`}
        >
          <Icon d={done === "csv" ? CHECK : TABLE} />
          Data (CSV)
        </button>
      )}
      <button type="button" onClick={copy} disabled={busy !== null} title="Copy the answer's text">
        <Icon d={done === "copy" ? CHECK : COPY} />
        {done === "copy" ? "Copied" : "Copy"}
      </button>
      {error && (
        <span role="alert" className="copilot-answer-actions-error">
          {error}
        </span>
      )}
    </div>
  );
}
