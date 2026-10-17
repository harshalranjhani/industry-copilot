import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readDataConfig } from "@/lib/data/config";
import type { StoredDocument, StoredRule } from "@/lib/data/fleet";
import { openFleet } from "@/lib/data/fleet";
import { VIEW_DOCS } from "@/lib/data/schema";

// Written by `pnpm generate` (runs before dev and build) from src/library.ts.
const OPENUI_PROMPT_PATH = join(process.cwd(), "src/generated/openui-prompt.txt");
const GLOSSARY_PATH = join(process.cwd(), "GLOSSARY.md");

/** Until the user picker exists, nobody is identified. */
const USER_IDENTITY_PLACEHOLDER = "Not identified yet (the user picker is not available).";

export interface PromptParts {
  openUiPrompt: string;
  glossary: string;
  asOf: string;
  rules: StoredRule[];
  documents: StoredDocument[];
  userIdentity?: string;
}

const QUERY_GUIDE = `## Querying the fleet (the query tool)

query runs one read-only SQLite SELECT over the views below, and only these views. They already apply the manual rules and the corrections people have recorded, so never recompute producing status, spill counts or downtime yourself, and never count or sum in your head: let SQL do it, then report the numbers it returns.

Conventions:
- Periods: a relative period ends on AS_OF and is compared by date, both ends inclusive. "Last N months" is "inspected_on >= date(AS_OF, '-N months') AND inspected_on <= AS_OF"; "last N days" uses '-N days'; "in 2025" is "inspected_on >= '2025-01-01' AND inspected_on < '2026-01-01'". Substitute the AS_OF value for AS_OF.
- A repair belongs to a period by started_on, not by when it finished.
- Downtime comes only from the downtime view (7 days per non-producing inspection). repairs.job_hours is one job's duration, never the well's downtime.
- Spill counts, volumes, maps and heatmaps use the spills view, which already leaves out detections that were corrected (for example rainwater). Say so when the well has such a corrected detection (effective_inspections where spill_detected_original = 1 AND is_spill = 0).
- "Right now" is latest_inspections. A last-N-weeks series is the latest N rows of effective_inspections for the well, ordered by inspected_at.
- Area names and well IDs are filtered by exact text (area_name = 'Northeast Block 8'). Name areas, teams and people, and refer to wells by ID.
- When a query errors, read the message, fix the SQL and retry. If a result is truncated, aggregate or narrow it.

Why a well stopped: for each non-producing well look for (1) an open repair (repairs.is_open = 1, started before the latest inspection), (2) a note valid at AS_OF (notes.valid_at_as_of = 1) that names a shut-in or work, and (3) the inspector's remark on the latest inspection. Give a reason only from those. When none explains the stop, say plainly "No reason is recorded", quote any inspector remark as a remark rather than a cause, and suggest a check (for example a field visit or confirming with the area's team). Never guess a cause.

Visuals: a list of wells, events or repairs is a Table; one value over time is a LineChart (a LineChart cannot mark points, so when readings were not producing, suffix their labels with " ✕ not producing" and add a Callout naming those dates); comparing a few wells or areas is a BarChart. If the user names a visual, use that one. Cite every inspection, repair and note you used.

${VIEW_DOCS.map(
  (view) =>
    `### ${view.name}\n${view.description}\n${view.columns.map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ""}`).join("\n")}`,
).join("\n\n")}`;

const ANSWER_RULES = `## How to answer

- Always cite: every answer ends with a Sources block listing each inspection, record and document section (document ID and section number) you used.
- Cite records and document sections, never a view or tool name. For a figure that sums or counts many rows, cite the records behind it (at most about 15 sources; fetch their IDs with one more query).
- Never invent a cause. Give a reason for a stop only from what your tools returned; if nothing explains it, say so plainly and suggest a check.
- Judge producing status only from the tool's delta against the well type's threshold, never from absolute wellhead temperature, and never from the recorded status.
- When the recorded status disagrees with the latest inspection, say the recorded status is out of date.
- Use the view's own numbers; never do arithmetic on counts, sums or dates yourself.
- Refer to areas, teams and people by name, and to wells by ID.
- Show the visual the user names; otherwise pick the one that fits (a Card for one well).`;

function rulesSummary(rules: StoredRule[]): string {
  return rules
    .map((r) => `- ${r.wellType} ${r.key} = ${r.value} ${r.unit} (${r.document} §${r.section})`)
    .join("\n");
}

/** Assembles the copilot's system prompt from its parts. */
export function composeSystemPrompt(parts: PromptParts): string {
  const documents = parts.documents
    .map((d) => `### ${d.documentId} (${d.kind}, ${d.path})\n\n${d.text}`)
    .join("\n\n---\n\n");
  return [
    parts.openUiPrompt,
    `## Who you are talking to\n\n${parts.userIdentity ?? USER_IDENTITY_PLACEHOLDER}`,
    `## Dates\n\nToday (AS_OF) is ${parts.asOf}. "Right now" always means each well's latest inspection, not today's date. Say when that inspection was.`,
    QUERY_GUIDE,
    `## Domain glossary\n\n${parts.glossary}`,
    `## Parsed rules\n\nThese were read from the manuals and SOPs. Cite the document and section.\n\n${rulesSummary(parts.rules)}`,
    ANSWER_RULES,
    `## Manuals and SOPs (full text)\n\n${documents}`,
  ].join("\n\n");
}

/** The production prompt: the loaded data store's rules and documents plus the generated OpenUI prompt. */
export function buildSystemPrompt(): string {
  const { dbPath, knowledgePath, asOf } = readDataConfig();
  const fleet = openFleet(dbPath, { knowledgePath, asOf });
  try {
    return composeSystemPrompt({
      openUiPrompt: readFileSync(OPENUI_PROMPT_PATH, "utf-8"),
      glossary: readFileSync(GLOSSARY_PATH, "utf-8"),
      asOf,
      rules: fleet.rules(),
      documents: fleet.documents(),
    });
  } finally {
    fleet.close();
  }
}
