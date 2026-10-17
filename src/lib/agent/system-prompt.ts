import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readDataConfig } from "@/lib/data/config";
import type { StoredDocument, StoredRule } from "@/lib/data/fleet";
import { openFleet } from "@/lib/data/fleet";
import { VIEW_DOCS } from "@/lib/data/schema";
import type { CopilotUser } from "@/lib/conversations/identity";
import type { DigestEntry } from "@/lib/conversations/store";

// Written by `pnpm generate` (runs before dev and build) from src/library.ts.
const OPENUI_PROMPT_PATH = join(process.cwd(), "src/generated/openui-prompt.txt");
const GLOSSARY_PATH = join(process.cwd(), "GLOSSARY.md");

export interface PromptParts {
  openUiPrompt: string;
  glossary: string;
  asOf: string;
  rules: StoredRule[];
  documents: StoredDocument[];
  user: CopilotUser;
  /** The user's own recent answers, newest first. */
  memory: DigestEntry[];
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

Compliance ("which rules were broken", "what is still open"): use spill_compliance for each spill's SR-01, SR-02 and SR-03 duties, regulator_events for notices of violation, fines and the RC-04 response, rca_candidates for root-cause analyses that are due, and repairs for the RC-02 yearly flowline integrity test (issue = 'Annual flowline integrity test'). Then:
- A breach is any status starting with breached: breached_late (done after the deadline) or breached_open (the deadline passed and it is still not done). A breached_open duty is a breach even though it is still open (for example an SR-03 verification past its due date, or an RC-04 response never filed): list it with the breaches and say it is still open. Give each breach its protocol, the limit (with the due date for a deadline), the actual value, and the evidence (inspection, regulator event, report).
- An open action is never a breach: its deadline has not passed or its work is under way. Open actions are a pending status, a root-cause analysis that is due (rca_candidates.needs_rca = 1, with its repair IDs and anything the reports say about it), and a valid note about a shut-in or planned work that is not yet recorded in the maintenance system (always read the well's notes valid at AS_OF with well_snapshot and compare them with its open repairs; the manual requires recording a shut-in before work starts). List them separately and say they are not counted as breaches; the open-actions Callout never repeats a breach.
- Always check the RC-02 yearly flowline integrity test for the period and say whether it was met, with the date and repair.
- Open fines are regulator_events with status = 'open': always give the total and say they are still open.
- Containment hours and the report's compliance check exist only in repair reports; cite the report. read_report shows a whole report; search_reports finds reports that mention something. When class_mismatch = 1 the report's class (and the duties it listed) no longer hold: say so.
- Show breaches as a Table (Protocol, Limit, Actual, Evidence) and the open actions in a Callout after it.
- Cite the repair reports (kind report, by maintenance ID), the regulator events (kind regulator_event, by event ID) and each SOP protocol (kind document, e.g. "SOP-SR §4 SR-02").

Visuals: a list of wells, events or repairs is a Table; one value over time is a LineChart (a LineChart cannot mark points, so when readings were not producing, suffix their labels with " ✕ not producing" and add a Callout naming those dates); comparing a few wells or areas is a BarChart. If the user names a visual, use that one. Cite every inspection, repair and note you used.

${VIEW_DOCS.map(
  (view) =>
    `### ${view.name}\n${view.description}\n${view.columns.map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ""}`).join("\n")}`,
).join("\n\n")}`;

const KNOWLEDGE_GUIDE = `## What people teach you (shared knowledge)

Corrections, notes and claims recorded by anyone apply to everyone, and the views already include them. Show where they changed or qualified an answer.

Record user-stated facts in the same turn, with record_knowledge, before you answer:
- A correction to an inspection value ("the 15 Oct reading for WELL-0164 is wrong; re-measured at 41.0 °C"): kind correction, with the inspection ID (find it with a query on effective_inspections), the field (wellhead_temp_c, ambient_temp_c, spill_detected, spill_est_volume_bbl), the value and the user's reason. The original value stays on record.
- A fact to share about a well ("WELL-0007 will be shut in from 17 Oct for 10 days"): kind note, with the well, the text and the dates it applies (valid_from, valid_to).
- A statement that a well is or isn't producing ("WELL-0175 is running fine", "shut in since 14 Oct"): kind claim, with asserts_producing. A claim the latest inspection contradicts is stored as unconfirmed and changes nothing; a claim it supports is accepted.
- A team rule for every well of a type ("for all T350 wells we want a pump jack root-cause analysis after 2 repairs, not 3"): kind rule_override, with well_type, rule_key rca_corrective_count, rule_value (the count) and the user's words as text. It applies to that well type only; never record it for other types, and ask which well type when the user doesn't say.
- The author is the user who said it: use the name they gave, and ask who is speaking when you don't know.
- Never record a question, and never record something you inferred yourself.

Then answer from the result:
- Say plainly what was recorded, with the original value beside the new one, and the effect (for example "WELL-0164 is now producing: 21.1 °C above the air, the T200 threshold is 15 °C").
- Surface every conflict: quote the inspector's remark or the other person's note, name who wrote it, say it disagrees, and ask the user to confirm. Do not undo the entry yourself.
- When a claim is unconfirmed, tell the user what the latest inspection shows (inspection ID, date, who inspected, the delta), cite any note that agrees with the inspection (read well_snapshot's validNotes), say you have kept their statement on record as unconfirmed, and ask them to confirm.
- A correction to a spill's volume or detection returns its compliance before and after (effect.compliance). Narrate it: the new class and whether a report is now required; when so, the SR-01 deadline (report_due_at) and its status (breached_open means the deadline has passed with no written notice on record: say it is a possible SR-01 breach and ask to check whether notice was sent), the SR-02 status that already stood, and the SR-03 verification due date. When classMismatch is true, say that the repair report's stated class (and the reporting duties it listed) no longer holds, naming the report. Keep the AI's original estimate beside the measured volume.
- A rule override returns ruleEffect: the count before and after and the wells whose root-cause analysis became due. Say whose rule it is, that it replaces the manual's count for that well type only, and list the wells newly due.
- Add the entry to Sources as kind knowledge.

Markers (a Tag or a Callout, wherever the answer uses knowledge):
- "corrected by <name>" next to any value a correction changed (wellhead_temp_c_original beside wellhead_temp_c; corrections, corrected_by_name): give the original and the new value. Use a Tag with variant "info".
- "unconfirmed claim" next to a claim with status unconfirmed (notes.status), naming who made it. Use a Tag with variant "warning".
- "disputed" when notes disagree about an inspection (disputes, notes.status = 'disputed', latest_inspection.disputed): show both sides, each with author, role and note ID, say that neither is a formal correction and that the detection stands (it still counts as a spill) unless one is made, and use a Tag with variant "warning".
- A well's valid notes (well_snapshot validNotes) and any shared note about it are part of "what is known": mention a planned shut-in or workover that someone shared, with who said it and the dates, and cite it as kind knowledge (chat origin) or note (dataset origin).

Cite corrections, claims, rule overrides and shared notes by their entry ID as kind knowledge.

Rule overrides: rca_candidates already applies them, and its rule_source says which rule applied to each well, so judge row by row. For a well whose rule_source is "user rule by <name>", say it follows that person's rule for its well type, not the manual (give the manual's count from manual_rca_threshold beside it, and its document and section from rule_overrides.manual_document and manual_section), and cite the override's rule_entry_id as kind knowledge. A well of another type keeps its manual's count and is cited to that manual: when such a well has as many repairs as a well the rule added (for example a T200 well with 2 repairs when the rule is for T350), say it is not added because the rule is for the other well type only.`;

const ANSWER_RULES = `## How to answer

- Always cite: every answer ends with a Sources block listing each inspection, record and document section (document ID and section number) you used.
- Cite records and document sections, never a view or tool name. For a figure that sums or counts many rows, cite the records behind it (at most about 15 sources; fetch their IDs with one more query).
- Never invent a cause. Give a reason for a stop only from what your tools returned; if nothing explains it, say so plainly and suggest a check.
- Judge producing status only from the tool's delta against the well type's threshold, never from absolute wellhead temperature, and never from the recorded status.
- When the recorded status disagrees with the latest inspection, say the recorded status is out of date.
- Use the view's own numbers; never do arithmetic on counts, sums or dates yourself.
- Refer to areas, teams and people by name, and to wells by ID.
- Show the visual the user names; otherwise pick the one that fits (a Card for one well).`;

const MEMORY_GUIDE = `Private memory: the entries below are this user's own earlier answers, newest first, and nobody else's. "Yesterday", "last time" and "earlier" mean this user's previous conversations: resolve "the wells we discussed" to the wells an earlier entry names (the entry that fits the question best), then query those wells as usual. Use recall_my_conversations when the digest is not enough (older or more detailed), or to read an earlier conversation back. When the user refers to an earlier conversation and neither the digest nor recall_my_conversations has it, say plainly that you have no such earlier conversation with them; do not guess wells, do not run queries for them, ask which wells they mean if useful, and never use or mention anyone else's conversations.`;

function memorySection(user: CopilotUser, memory: DigestEntry[]): string {
  const entries = memory.length
    ? memory
        .map((m) => {
          const named = [
            m.wells.length && `wells ${m.wells.join(", ")}`,
            m.areas.length && `areas ${m.areas.join(", ")}`,
            m.recordIds.length && `records ${m.recordIds.slice(0, 8).join(", ")}${m.recordIds.length > 8 ? ", …" : ""}`,
          ].filter(Boolean);
          return `- [${m.createdAt.slice(0, 10)}, conversation ${m.conversationId}] Asked: ${m.question}\n  Answer: ${m.summary}${named.length ? `\n  Named: ${named.join("; ")}` : ""}`;
        })
        .join("\n")
    : `${user.name} has no earlier conversations with you.`;
  return `## ${user.name}'s private memory\n\n${MEMORY_GUIDE}\n\n${entries}`;
}

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
    `## Who you are talking to\n\n${parts.user.name} (user ID ${parts.user.userId}), ${parts.user.role.replaceAll("_", " ")}${parts.user.teamName ? `, team ${parts.user.teamName}` : ""}. When they state a fact to record, they are the author.`,
    memorySection(parts.user, parts.memory),
    `## Dates\n\nToday (AS_OF) is ${parts.asOf}. "Right now" always means each well's latest inspection, not today's date. Say when that inspection was.`,
    QUERY_GUIDE,
    KNOWLEDGE_GUIDE,
    `## Domain glossary\n\n${parts.glossary}`,
    `## Parsed rules\n\nThese were read from the manuals and SOPs. Cite the document and section.\n\n${rulesSummary(parts.rules)}`,
    ANSWER_RULES,
    `## Manuals and SOPs (full text)\n\n${documents}`,
  ].join("\n\n");
}

/** The user-independent parts of the production prompt: the loaded data store's rules and documents plus the generated OpenUI prompt. */
export function loadStaticPromptParts(): Omit<PromptParts, "user" | "memory"> {
  const { dbPath, knowledgePath, asOf } = readDataConfig();
  const fleet = openFleet(dbPath, { knowledgePath, asOf });
  try {
    return {
      openUiPrompt: readFileSync(OPENUI_PROMPT_PATH, "utf-8"),
      glossary: readFileSync(GLOSSARY_PATH, "utf-8"),
      asOf,
      rules: fleet.rules(),
      documents: fleet.documents(),
    };
  } finally {
    fleet.close();
  }
}
