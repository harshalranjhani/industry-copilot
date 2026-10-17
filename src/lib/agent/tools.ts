import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";
import { type Fleet, type KnowledgeInput, KnowledgeError, QueryError } from "@/lib/data/fleet";

const PingParams = Type.Object({
  message: Type.Optional(Type.String({ description: "Text to echo back" })),
});

/** Placeholder domain tool so the tool trace can be shown without a dataset. */
export const pingTool: AgentTool<typeof PingParams> = {
  name: "ping",
  label: "Ping",
  description: "Health check. Echoes the given message back with the server time.",
  parameters: PingParams,
  execute: async (_toolCallId, params) => {
    const reply = `pong${params.message ? `: ${params.message}` : ""} (server time ${new Date().toISOString()})`;
    return { content: [{ type: "text", text: reply }], details: undefined };
  },
};

const WellSnapshotParams = Type.Object({
  asset_id: Type.String({ description: 'Well ID, e.g. "WELL-0001"' }),
});

function wellSnapshotTool(fleet: Fleet): AgentTool<typeof WellSnapshotParams> {
  return {
    name: "well_snapshot",
    label: "Well snapshot",
    description:
      "A well's state right now, i.e. at its latest inspection: whether it is producing oil (judged from the wellhead-minus-ambient delta against its well type's threshold), who inspected it, when and how, the recorded status and whether it is out of date, well type, area name, location, and the manual rule (document and section) used, repairs still open (openRepairs) and notes valid today (validNotes: includes what users shared and claims, each with its status accepted / unconfirmed / disputed and origin), which are the recorded reasons for a stop. The latest inspection lists its corrections (original and corrected values, who and why) and whether it is disputed; tell the user when a value was corrected by someone. Cite the inspection ID, the well's metadata, the rule's document section, and any repair or note you rely on.",
    parameters: WellSnapshotParams,
    execute: async (_toolCallId, params) => {
      const snapshot = fleet.wellSnapshot(params.asset_id);
      const result = snapshot ?? { error: `No well with ID ${params.asset_id}` };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], details: undefined };
    },
  };
}

const QueryParams = Type.Object({
  sql: Type.String({ description: "One read-only SELECT statement over the documented views" }),
});

function queryTool(fleet: Fleet): AgentTool<typeof QueryParams> {
  return {
    name: "query",
    label: "Query fleet views",
    description:
      "Run one read-only SQL SELECT (SQLite dialect) over the fleet views documented in the system prompt, and nothing else. Use it for any question across wells, areas, periods, spills, repairs or notes; let SQL do the counting and summing. Rows are capped: aggregate or narrow the query when the result says it was truncated. If the query is rejected, the error says why, so fix it and try again.",
    parameters: QueryParams,
    execute: async (_toolCallId, params) => {
      let result: unknown;
      try {
        const { columns, rows, truncated } = fleet.query(params.sql);
        result = {
          columns,
          rows,
          rowCount: rows.length,
          ...(truncated && { truncated: `Only the first ${rows.length} rows are shown. Aggregate or narrow the query.` }),
        };
      } catch (err) {
        if (!(err instanceof QueryError)) throw err;
        result = { error: err.message };
      }
      return { content: [{ type: "text", text: JSON.stringify(result) }], details: undefined };
    },
  };
}

const ReadReportParams = Type.Object({
  maintenance_id: Type.String({ description: 'Repair (maintenance) ID, e.g. "MNT-0001-029"' }),
});

function readReportTool(fleet: Fleet): AgentTool<typeof ReadReportParams> {
  return {
    name: "read_report",
    label: "Read repair report",
    description:
      "The free-text report of one repair, by its maintenance ID: the full text plus the facts extracted from it (containment hours, the spill class the report states, and every row of its compliance check: protocol, result, detail). Some facts exist only here, such as containment time, root cause and recommended actions. Cite the report as kind report with the maintenance ID.",
    parameters: ReadReportParams,
    execute: async (_toolCallId, params) => {
      const report = fleet.report(params.maintenance_id);
      const result = report ?? { error: `No report for repair ${params.maintenance_id} (it may have no report_file)` };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], details: undefined };
    },
  };
}

const SearchReportsParams = Type.Object({
  text: Type.String({ description: "Words or a phrase to find, e.g. \"on-call handover\" or coupling corrosion" }),
  asset_id: Type.Optional(Type.String({ description: "Only this well's reports" })),
});

function searchReportsTool(fleet: Fleet): AgentTool<typeof SearchReportsParams> {
  return {
    name: "search_reports",
    label: "Search repair reports",
    description:
      "Full-text search over every repair report, best match first (up to 10). Returns each hit's maintenance ID, well, report file and a snippet with matched words in [brackets]. Use it to find reports that mention something; then read_report for the whole report. For numbers already extracted (containment hours, compliance checks of spills), prefer the spill_compliance view.",
    parameters: SearchReportsParams,
    execute: async (_toolCallId, params) => {
      const hits = fleet.searchReports(params.text, { assetId: params.asset_id });
      return { content: [{ type: "text", text: JSON.stringify({ hits, hitCount: hits.length }) }], details: undefined };
    },
  };
}

const RecordKnowledgeParams = Type.Object({
  kind: Type.Union([Type.Literal("correction"), Type.Literal("note"), Type.Literal("claim"), Type.Literal("rule_override")], {
    description:
      "correction: a re-measured or wrong inspection value. note: a fact to share about a well (a planned shut-in, a remark). claim: a statement about whether a well is producing. rule_override: a team rule that replaces a manual rule for every well of one well type.",
  }),
  author: Type.String({ description: "The user who stated it: their full name or user ID, exactly as they gave it" }),
  asset_id: Type.Optional(Type.String({ description: "Well ID. Required for a note or claim" })),
  inspection_id: Type.Optional(
    Type.String({ description: "Inspection ID. Required for a correction; for a note, the inspection it is about" }),
  ),
  field: Type.Optional(
    Type.Union(
      [
        Type.Literal("wellhead_temp_c"),
        Type.Literal("ambient_temp_c"),
        Type.Literal("spill_detected"),
        Type.Literal("spill_est_volume_bbl"),
      ],
      { description: "Correction only: the inspection field that was wrong" },
    ),
  ),
  value: Type.Optional(
    Type.Union([Type.Number(), Type.Boolean()], {
      description: "Correction only: the corrected value (°C, bbl, or false for spill_detected = not a spill)",
    }),
  ),
  reason: Type.Optional(Type.String({ description: "Correction: why the recorded value was wrong, in the user's words. Rule override: why, if given" })),
  text: Type.Optional(Type.String({ description: "Note, claim or rule override: the statement, in the user's words (naming the well, or the well type for a rule)" })),
  asserts_producing: Type.Optional(
    Type.Boolean({ description: "Claim only: true if it says the well is producing/running, false if shut in/stopped/down" }),
  ),
  well_type: Type.Optional(Type.String({ description: 'Rule override only: the one well type it applies to, e.g. "T350"' })),
  rule_key: Type.Optional(
    Type.Literal("rca_corrective_count", {
      description: "Rule override only: the rule changed. rca_corrective_count is the number of corrective repairs on one equipment kind that triggers a root-cause analysis",
    }),
  ),
  rule_value: Type.Optional(Type.Number({ description: "Rule override only: the team's count, e.g. 2 for \"after 2 repairs\"" })),
  valid_from: Type.Optional(Type.String({ description: "Note or claim: first date it applies, YYYY-MM-DD" })),
  valid_to: Type.Optional(Type.String({ description: "Note or claim: last date it applies, YYYY-MM-DD; omit when open-ended" })),
});

function recordKnowledgeTool(fleet: Fleet): AgentTool<typeof RecordKnowledgeParams> {
  return {
    name: "record_knowledge",
    label: "Record knowledge",
    description:
      "Record something the user taught you, for every user from now on: a correction to an inspection value (the original is kept beside it, attributed), a note shared about a well, a claim about whether a well is producing, or a rule override (a team rule for every well of one well type, applied to that type only and cited as the user's rule, not the manual's). Call it in the same turn the user states the fact. The result gives the effect (before and after the derived results, e.g. producing; for a spill's volume or detection also its compliance before and after: report required, SR-01, SR-02, SR-03 and whether the repair report's class is stale), the ruleEffect of a rule override (the count before and after and the wells whose root-cause analysis became due), the conflicts (other evidence that disagrees: the inspector's remark, other people's notes, or for a claim the latest inspection) and, for a claim the data contradicts, status unconfirmed. Tell the user what was recorded, surface every conflict and ask them to confirm. An error says what to fix.",
    parameters: RecordKnowledgeParams,
    executionMode: "sequential",
    execute: async (_toolCallId, params) => {
      let result: unknown;
      try {
        const author = fleet.findUser(params.author);
        if (!author) throw new KnowledgeError(`No user named or with ID "${params.author}". Ask who is speaking.`);
        const need = <T,>(value: T | undefined, name: string): T => {
          if (value === undefined) throw new KnowledgeError(`${name} is required for a ${params.kind}.`);
          return value;
        };
        const input: KnowledgeInput =
          params.kind === "correction"
            ? {
                kind: "correction",
                authorUserId: author.userId,
                inspectionId: need(params.inspection_id, "inspection_id"),
                field: need(params.field, "field"),
                value: need(params.value, "value"),
                reason: need(params.reason, "reason"),
              }
            : params.kind === "rule_override"
            ? {
                kind: "rule_override",
                authorUserId: author.userId,
                wellType: need(params.well_type, "well_type"),
                ruleKey: need(params.rule_key, "rule_key"),
                value: need(params.rule_value, "rule_value"),
                text: need(params.text, "text"),
                reason: params.reason,
              }
            : {
                kind: params.kind,
                authorUserId: author.userId,
                assetId: need(params.asset_id, "asset_id"),
                text: need(params.text, "text"),
                validFrom: params.valid_from,
                validTo: params.valid_to,
                ...(params.kind === "note" ? { inspectionId: params.inspection_id } : { assertsProducing: params.asserts_producing }),
              };
        result = { recorded: fleet.recordKnowledge(input), author: author.name };
      } catch (err) {
        if (!(err instanceof KnowledgeError)) throw err;
        result = { error: err.message };
      }
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], details: undefined };
    },
  };
}

/** The agent's whole toolset: domain tools only, never shell, file or edit tools. */
export function createCopilotTools(fleet: Fleet): AgentTool<any>[] {
  return [wellSnapshotTool(fleet), queryTool(fleet), readReportTool(fleet), searchReportsTool(fleet), recordKnowledgeTool(fleet)];
}
