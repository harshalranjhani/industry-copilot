import { describe, expect, it } from "vitest";
import { toolStatusMessage } from "./tool-labels";

describe("toolStatusMessage", () => {
  it("names the fleet query in words", () => {
    expect(toolStatusMessage({ toolName: "query", status: "complete", input: { sql: "SELECT 1" } })).toBe("Querying fleet views");
  });

  it("says which report is being read", () => {
    expect(
      toolStatusMessage({ toolName: "read_report", status: "executing", input: { maintenance_id: "MNT-0001-029" } }),
    ).toBe("Reading report MNT-0001-029");
  });

  it("says which well a snapshot is for", () => {
    expect(toolStatusMessage({ toolName: "well_snapshot", status: "complete", input: { asset_id: "WELL-0001" } })).toBe(
      "Checking WELL-0001's latest state",
    );
  });

  it("drops the ID until the streamed arguments have it", () => {
    expect(toolStatusMessage({ toolName: "read_report", status: "streaming", input: {} })).toBe("Reading a repair report");
  });

  it("labels the other tools", () => {
    const label = (toolName: string) => toolStatusMessage({ toolName, status: "complete", input: {} });
    expect(label("search_reports")).toBe("Searching repair reports");
    expect(label("record_knowledge")).toBe("Saving what you told me");
    expect(label("recall_my_conversations")).toBe("Recalling your earlier conversations");
  });

  it("says so when a tool failed", () => {
    expect(toolStatusMessage({ toolName: "query", status: "error", input: {} })).toBe("Querying fleet views failed");
  });

  it("leaves a tool it does not know to the shell's own wording", () => {
    expect(toolStatusMessage({ toolName: "mystery_tool", status: "complete", input: {} })).toBeUndefined();
  });
});
