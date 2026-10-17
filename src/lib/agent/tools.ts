import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";
import { type Fleet, QueryError } from "@/lib/data/fleet";

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
      "A well's state right now, i.e. at its latest inspection: whether it is producing oil (judged from the wellhead-minus-ambient delta against its well type's threshold), who inspected it, when and how, the recorded status and whether it is out of date, well type, area name, location, and the manual rule (document and section) used, repairs still open (openRepairs) and notes valid today (validNotes), which are the recorded reasons for a stop. Cite the inspection ID, the well's metadata, the rule's document section, and any repair or note you rely on.",
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

/** The agent's whole toolset: domain tools only, never shell, file or edit tools. */
export function createCopilotTools(fleet: Fleet): AgentTool<any>[] {
  return [wellSnapshotTool(fleet), queryTool(fleet)];
}
