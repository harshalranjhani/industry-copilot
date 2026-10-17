import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SAMPLE_DATA_DIR } from "./config";
import { type Fleet, openFleet } from "./fleet";
import { loadDataset } from "./loader";

// Golden checks for the sample dataset's example questions: facts the
// challenge docs state, asserted through the loader and the fleet views.
let workDir: string;
let fleet: Fleet;

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), "copilot-golden-"));
  const dbPath = join(workDir, "copilot.db");
  loadDataset({ roots: [SAMPLE_DATA_DIR], dbPath });
  fleet = openFleet(dbPath);
});

afterAll(() => {
  fleet?.close();
  rmSync(workDir, { recursive: true, force: true });
});

describe("Q1: is WELL-0001 producing oil right now?", () => {
  it("reports the latest inspection as not producing, with a stale recorded status", () => {
    const snapshot = fleet.wellSnapshot("WELL-0001");

    expect(snapshot?.latestInspection).toMatchObject({
      inspectionId: "INS-0001-0203",
      inspectedAt: "2026-10-15T09:45:00Z",
      method: "drone",
      inspectorName: "Ryan Brooks",
      deltaC: 3.2,
      producing: false,
    });
    expect(snapshot?.recordedStatus).toBe("active");
    expect(snapshot?.statusMismatch).toBe(true);
    expect(snapshot?.wellType).toBe("T200");
    expect(snapshot?.areaName).toBe("Southwest Block 23");
    expect(snapshot?.location).toEqual({ lat: 31.85425, lon: -102.50232 });
    expect(snapshot?.producingRule).toMatchObject({ thresholdC: 15, document: "OM-T200", section: "9.3" });
  });
});

describe("rules parsed from the manuals", () => {
  const ruleFor = (wellType: string, key: string) => fleet.rules().find((r) => r.wellType === wellType && r.key === key);

  it("stores each rule with value, unit, document and section", () => {
    expect(ruleFor("T200", "producing_threshold_c")).toMatchObject({ value: 15, document: "OM-T200", section: "9.3" });
    expect(ruleFor("T350", "producing_threshold_c")).toMatchObject({ value: 20, document: "OM-T350", section: "3" });
    expect(ruleFor("T200", "temperature_alarm_c")).toMatchObject({ value: 85, document: "OM-T200", section: "9.4" });
    expect(ruleFor("T350", "temperature_alarm_c")).toMatchObject({ value: 95, document: "OM-T350", section: "4" });
    expect(ruleFor("T200", "spill_shut_in_pct")).toMatchObject({ value: 5, document: "OM-T200", section: "9.5" });
    expect(ruleFor("T200", "rca_corrective_count")).toMatchObject({ value: 3, document: "OM-T200", section: "10" });
    expect(ruleFor("T200", "rca_window_months")).toMatchObject({ value: 12, document: "OM-T200", section: "10" });
    expect(ruleFor("T200", "escalation_days")).toMatchObject({ value: 14, document: "OM-T200", section: "10" });
  });

  it("lets T350 inherit the rules its manual defers to T200", () => {
    for (const key of ["spill_shut_in_pct", "rca_corrective_count", "rca_window_months", "escalation_days"]) {
      expect(ruleFor("T350", key), key).toMatchObject({ document: "OM-T200" });
    }
    expect(ruleFor("T350", "rca_corrective_count")?.value).toBe(3);
  });
});

describe("loading", () => {
  it("fails naming the document when a required rule is missing from a manual", () => {
    const root = mkdtempSync(join(tmpdir(), "copilot-bad-"));
    try {
      mkdirSync(join(root, "fleet/well-types"), { recursive: true });
      mkdirSync(join(root, "assets/WELL-9001"), { recursive: true });
      writeFileSync(
        join(root, "fleet/well-types/T900.md"),
        'Document ID: OM-T900 · Applies to all wells with `well_type = "T900"`\n\n## 1. Scope\n\nNo temperature rule here.\n',
      );
      writeFileSync(
        join(root, "assets/WELL-9001/metadata.json"),
        JSON.stringify({ asset_id: "WELL-9001", well_type: "T900" }),
      );
      expect(() => loadDataset({ roots: [root], dbPath: join(root, "bad.db") })).toThrow(/OM-T900/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
