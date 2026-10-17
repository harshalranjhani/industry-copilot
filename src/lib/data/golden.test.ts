import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SAMPLE_DATA_DIR } from "./config";
import { type Fleet, openFleet, QueryError } from "./fleet";
import { VIEW_DOCS } from "./schema";
import { openKnowledgeStore } from "./knowledge";
import { loadDataset } from "./loader";

// Golden checks for the sample dataset's example questions: facts the
// challenge docs state, asserted through the loader and the fleet views.
let workDir: string;
let fleet: Fleet;

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), "copilot-golden-"));
  const dbPath = join(workDir, "copilot.db");
  const knowledgePath = join(workDir, "knowledge.db");
  loadDataset({ roots: [SAMPLE_DATA_DIR], dbPath, knowledgePath });
  fleet = openFleet(dbPath, { knowledgePath, asOf: "2026-10-17" });
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

const rowsOf = (sql: string) => fleet.query(sql).rows;

describe("Q4: WELL-0001's spills in the last 4 years", () => {
  it("counts 6 real spills totalling 15.1 bbl, leaving out the detection corrected as rainwater", () => {
    const spills = rowsOf(
      "SELECT inspection_id, inspected_on, spill_effective_volume_bbl AS bbl FROM spills WHERE asset_id = 'WELL-0001' ORDER BY inspected_at",
    );

    expect(spills.map((s) => [s.inspected_on, s.bbl])).toEqual([
      ["2023-03-16", 0.5],
      ["2023-04-27", 2.6],
      ["2023-09-28", 3.3],
      ["2023-10-19", 0.3],
      ["2026-06-11", 6.8],
      ["2026-10-01", 1.6],
    ]);
    expect(spills.map((s) => s.inspection_id)).not.toContain("INS-0001-0070");
    expect(rowsOf("SELECT ROUND(SUM(spill_effective_volume_bbl), 1) AS total FROM spills WHERE asset_id = 'WELL-0001'")).toEqual([{ total: 15.1 }]);
  });

  it("classifies each by its volume against the Spill Response SOP's bounds", () => {
    const classes = rowsOf(
      "SELECT spill_class FROM spills WHERE asset_id = 'WELL-0001' ORDER BY inspected_at",
    ).map((r) => r.spill_class);

    expect(classes).toEqual(["minor", "moderate", "moderate", "minor", "reportable", "moderate"]);
    expect(
      rowsOf("SELECT COUNT(*) AS n FROM spills WHERE spill_effective_volume_bbl >= 25 AND spill_class <> 'major'"),
    ).toEqual([{ n: 0 }]);
  });

  it("keeps the original detection beside the effective value and names the correction", () => {
    expect(
      rowsOf("SELECT spill_detected_original, is_spill, correction_id FROM effective_inspections WHERE inspection_id = 'INS-0001-0070'"),
    ).toEqual([{ spill_detected_original: 1, is_spill: 0, correction_id: "CTX-0001-001" }]);
  });
});

describe("well_snapshot: reasons for a stop", () => {
  it("Q1: carries the valid shut-in note that explains WELL-0001's stop", () => {
    const notes = fleet.wellSnapshot("WELL-0001")?.validNotes ?? [];

    expect(notes.find((n) => n.noteId === "CTX-0001-003")).toMatchObject({
      authorName: "Jake Morales",
      validFrom: "2026-10-07",
      validTo: "2026-10-20",
    });
    expect(notes.find((n) => n.noteId === "CTX-0001-003")?.text).toMatch(/rod string replacement/);
  });

  it("leaves out notes that have expired by AS_OF", () => {
    const ids = (fleet.wellSnapshot("WELL-0101")?.validNotes ?? []).map((n) => n.noteId);

    expect(ids).not.toContain("CTX-0101-001");
    expect(ids).toEqual(expect.arrayContaining(["CTX-0101-002", "CTX-0101-003"]));
  });

  it("Q2: lists the open repair behind WELL-0170's stop, and none for WELL-0164", () => {
    expect(fleet.wellSnapshot("WELL-0170")?.openRepairs).toEqual([
      expect.objectContaining({ maintenanceId: "MNT-0170-031", startedAt: "2026-09-19T08:00:00Z" }),
    ]);
    expect(fleet.wellSnapshot("WELL-0164")?.openRepairs).toEqual([]);
  });
});

describe("Q3: WELL-0001's last 13 weeks", () => {
  it("gives 13 readings from 23 Jul to 15 Oct, not producing on 8 and 15 Oct", () => {
    const readings = rowsOf(
      "SELECT inspected_on, wellhead_temp_c, ambient_temp_c, producing FROM effective_inspections WHERE asset_id = 'WELL-0001' ORDER BY inspected_at DESC LIMIT 13",
    ).reverse();

    expect(readings).toHaveLength(13);
    expect(readings[0]?.inspected_on).toBe("2026-07-23");
    expect(readings.at(-1)?.inspected_on).toBe("2026-10-15");
    expect(readings.filter((r) => !r.producing).map((r) => r.inspected_on)).toEqual(["2026-10-08", "2026-10-15"]);
  });
});

describe("downtime", () => {
  it("Q5: WELL-0001 was down 21 days in 2025, from three non-producing inspections", () => {
    const days = rowsOf(
      "SELECT inspected_on, downtime_days FROM downtime WHERE asset_id = 'WELL-0001' AND inspected_on >= '2025-01-01' AND inspected_on < '2026-01-01' ORDER BY inspected_at",
    );

    expect(days).toEqual([
      { inspected_on: "2025-07-24", downtime_days: 7 },
      { inspected_on: "2025-10-16", downtime_days: 7 },
      { inspected_on: "2025-10-23", downtime_days: 7 },
    ]);
  });
});

describe("relative periods end today and are compared by date", () => {
  // "Last N months/days" runs from date(AS_OF, '-N months'|'-N days') through AS_OF, both inclusive.
  it("Q6: the 3 wells with most downtime in Northeast Block 7 over the last 4 months", () => {
    const ranking = rowsOf(
      `SELECT asset_id, SUM(downtime_days) AS days FROM downtime
       WHERE area_name = 'Northeast Block 7' AND inspected_on >= date('2026-10-17', '-4 months') AND inspected_on <= '2026-10-17'
       GROUP BY asset_id ORDER BY days DESC LIMIT 4`,
    );

    expect(ranking[0]).toEqual({ asset_id: "WELL-0121", days: 49 });
    // WELL-0138 and WELL-0107 tie at 42 days, so their order is not part of the answer.
    expect(ranking.slice(1, 3)).toEqual(expect.arrayContaining([
      { asset_id: "WELL-0138", days: 42 },
      { asset_id: "WELL-0107", days: 42 },
    ]));
    expect(ranking[3]).toEqual({ asset_id: "WELL-0119", days: 28 });
  });

  it("Q7: 4 real spills in Northeast Block 8 in the last 90 days, with their locations", () => {
    const spills = rowsOf(
      `SELECT asset_id, inspected_on, spill_effective_volume_bbl AS bbl, lat, lon FROM spills
       WHERE area_name = 'Northeast Block 8' AND inspected_on >= date('2026-10-17', '-90 days') AND inspected_on <= '2026-10-17'
       ORDER BY inspected_at DESC`,
    );

    expect(spills).toEqual([
      { asset_id: "WELL-0151", inspected_on: "2026-09-24", bbl: 4.5, lat: 32.12246, lon: -102.18445 },
      { asset_id: "WELL-0165", inspected_on: "2026-07-30", bbl: 1.2, lat: 32.15665, lon: -102.14522 },
      { asset_id: "WELL-0175", inspected_on: "2026-07-30", bbl: 3.9, lat: 32.1802, lon: -102.1479 },
      { asset_id: "WELL-0186", inspected_on: "2026-07-23", bbl: 0.6, lat: 32.17552, lon: -102.17775 },
    ]);
  });
});

describe("Q8: 2026 spills by area and month", () => {
  it("totals 35, 43, 37 and 26, with corrected detections removed", () => {
    const totals = rowsOf(
      "SELECT area_name, COUNT(*) AS spills FROM spills WHERE inspected_month BETWEEN '2026-01' AND '2026-10' GROUP BY area_name ORDER BY area_name",
    );

    expect(totals).toEqual([
      { area_name: "Northeast Block 7", spills: 37 },
      { area_name: "Northeast Block 8", spills: 26 },
      { area_name: "Southwest Block 23", spills: 35 },
      { area_name: "Southwest Block 24", spills: 43 },
    ]);
    expect(
      rowsOf("SELECT inspected_month, COUNT(*) AS spills FROM spills WHERE area_name = 'Southwest Block 23' AND inspected_month BETWEEN '2026-01' AND '2026-03' GROUP BY 1"),
    ).toEqual([
      { inspected_month: "2026-01", spills: 4 },
      { inspected_month: "2026-02", spills: 3 },
      { inspected_month: "2026-03", spills: 3 },
    ]);
  });
});

describe("Q2: Northeast Block 8's non-producing wells right now", () => {
  it("lists WELL-0164, 0170, 0172 and 0175 with their deltas and recorded statuses", () => {
    const wells = rowsOf(
      `SELECT asset_id, inspected_on, delta_c, recorded_status, status_mismatch, notes FROM latest_inspections
       WHERE area_name = 'Northeast Block 8' AND NOT producing ORDER BY asset_id`,
    );

    expect(wells.map((w) => [w.asset_id, w.inspected_on, w.delta_c, w.recorded_status, w.status_mismatch])).toEqual([
      ["WELL-0164", "2026-10-15", 4.1, "active", 1],
      ["WELL-0170", "2026-10-15", 2.9, "down", 0],
      ["WELL-0172", "2026-10-15", 5.7, "active", 1],
      ["WELL-0175", "2026-10-15", 0.4, "active", 1],
    ]);
    expect(wells[0]?.notes).toBe("Pump jack not moving.");
  });

  it("finds the open repairs that explain two of them and none for the others", () => {
    const open = rowsOf(
      `SELECT asset_id, maintenance_id, started_on, issue FROM repairs
       WHERE is_open AND asset_id IN ('WELL-0164', 'WELL-0170', 'WELL-0172', 'WELL-0175') ORDER BY asset_id`,
    );

    expect(open.map((r) => [r.asset_id, r.maintenance_id, r.started_on])).toEqual([
      ["WELL-0170", "MNT-0170-031", "2026-09-19"],
      ["WELL-0172", "MNT-0172-028", "2026-10-03"],
    ]);
  });
});

describe("Q11: repair costs this year", () => {
  it("totals USD 25,794, 46,942 and 5,176 for WELL-0121, WELL-0138 and WELL-0107", () => {
    const costs = rowsOf(
      `SELECT asset_id, SUM(cost_usd) AS usd FROM repairs
       WHERE asset_id IN ('WELL-0121', 'WELL-0138', 'WELL-0107') AND started_on >= '2026-01-01' AND started_on <= '2026-10-17'
       GROUP BY asset_id ORDER BY asset_id`,
    );

    expect(costs).toEqual([
      { asset_id: "WELL-0107", usd: 5176 },
      { asset_id: "WELL-0121", usd: 25794 },
      { asset_id: "WELL-0138", usd: 46942 },
    ]);
  });
});

describe("query: read-only SQL over the documented views", () => {
  it("answers a SELECT over a view", () => {
    const result = fleet.query("SELECT COUNT(*) AS wells FROM latest_inspections");

    expect(result.columns).toEqual(["wells"]);
    expect(result.rows).toEqual([{ wells: 200 }]);
    expect(result.truncated).toBe(false);
  });

  it("caps the rows it returns and says so", () => {
    const result = fleet.query("SELECT inspection_id FROM effective_inspections", { maxRows: 5 });

    expect(result.rows).toHaveLength(5);
    expect(result.truncated).toBe(true);
  });

  it.each([
    ["a write", "DELETE FROM spills"],
    ["a write to a base table", "INSERT INTO wells (asset_id, well_type) VALUES ('X', 'T200')"],
    ["a schema change", "DROP VIEW spills"],
    ["an attach", "ATTACH DATABASE ':memory:' AS other"],
    ["a pragma", "PRAGMA table_info(wells)"],
    ["two statements", "SELECT 1; DELETE FROM spills"],
  ])("refuses %s", (_what, sql) => {
    expect(() => fleet.query(sql)).toThrow(QueryError);
    expect(rowsOf("SELECT COUNT(*) AS n FROM spills")[0]?.n).toBeGreaterThan(0);
  });

  it.each(["wells", "inspections", "knowledge_entries", "maintenance", "rules"])(
    "refuses the underlying table %s and names the views that are allowed",
    (table) => {
      expect(() => fleet.query(`SELECT * FROM ${table} LIMIT 1`)).toThrow(/views.*effective_inspections.*spills/s);
    },
  );

  it("allows a WITH clause over the views, and aggregates over views built from one", () => {
    expect(rowsOf("WITH s AS (SELECT * FROM spills WHERE asset_id = 'WELL-0001') SELECT COUNT(*) AS n FROM s")).toEqual([{ n: 6 }]);
    expect(rowsOf("SELECT COUNT(*) AS n FROM spill_compliance WHERE asset_id = 'WELL-0001'")).toEqual([{ n: 6 }]);
  });

  it("refuses a base table reached through a WITH clause", () => {
    expect(() => fleet.query("WITH w AS (SELECT * FROM wells) SELECT * FROM w")).toThrow(QueryError);
  });

  it("refuses a base table hidden between quoted names that contain quotes", () => {
    expect(() => fleet.query(`SELECT 1 AS "x'", * FROM users, (SELECT 2 AS "y'") LIMIT 2`)).toThrow(QueryError);
    expect(() => fleet.query(`SELECT * FROM "users"`)).toThrow(QueryError);
  });

  it("ignores table names inside string literals", () => {
    expect(rowsOf("SELECT COUNT(*) AS n FROM notes WHERE text LIKE '%wells%' AND 0")).toEqual([{ n: 0 }]);
  });

  it("refuses a base table reached through a subquery or join", () => {
    expect(() => fleet.query("SELECT * FROM spills WHERE asset_id IN (SELECT asset_id FROM wells)")).toThrow(QueryError);
    expect(() => fleet.query("SELECT * FROM spills s JOIN wells w ON w.asset_id = s.asset_id")).toThrow(QueryError);
  });

  it("explains a mistake in the SQL so the model can correct it", () => {
    expect(() => fleet.query("SELECT no_such_column FROM spills")).toThrow(/no such column: no_such_column/);
  });

  it("documents exactly the columns each view has", () => {
    for (const view of VIEW_DOCS) {
      const actual = fleet.query(`SELECT * FROM ${view.name} LIMIT 0`).columns;
      expect(actual, view.name).toEqual(view.columns.map((c) => c.name));
    }
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

describe("repair reports", () => {
  it("resolves a report through the repair's report_file, even with a non-standard name", () => {
    const report = fleet.report("MNT-0001-029");

    expect(report).toMatchObject({
      maintenanceId: "MNT-0001-029",
      assetId: "WELL-0001",
      reportFile: "maintenance-reports/MNT-0001-june-2026-flowline-spill.md",
      containmentHours: 7,
      statedClass: "reportable",
    });
    expect(report?.text).toMatch(/contained about 7 hours after the inspection flight/);
  });

  it("extracts every compliance-check row with its protocol, result and detail", () => {
    const checks = fleet.report("MNT-0001-029")?.checks ?? [];

    expect(checks.map((c) => c.protocol)).toEqual([
      "WS-01", "WS-02", "WS-03", "WS-04", "WS-05", "WS-06", "WS-07", "SR-01", "SR-02", "SR-03", "SR-04",
    ]);
    expect(checks.find((c) => c.protocol === "SR-02")).toEqual({
      protocol: "SR-02",
      result: "Not met",
      detail: "Contained about 7 hours after discovery (limit 4 hours)",
    });
    expect(fleet.report("MNT-0001-032")?.checks.at(-1)).toMatchObject({ protocol: "Manual §10", result: "Action required" });
  });

  it("has no report for a repair without a report_file, or an unknown repair", () => {
    expect(fleet.report("MNT-0001-030")).toBeUndefined();
    expect(fleet.report("MNT-9999-999")).toBeUndefined();
  });

  it("finds reports by full text, narrowed to a well", () => {
    const hits = fleet.searchReports("on-call handover", { assetId: "WELL-0001" });

    expect(hits.map((h) => h.maintenanceId)).toEqual(["MNT-0001-029"]);
    expect(hits[0]?.snippet).toMatch(/handover/i);
  });

  it("searches plain words even when they aren't valid search syntax", () => {
    expect(fleet.searchReports('coupling "wrap', { assetId: "WELL-0001" }).map((h) => h.maintenanceId)).toContain("MNT-0001-029");
  });
});

describe("Q9: the rules WELL-0001 broke in the last 12 months", () => {
  it("breaches SR-01, SR-02 and SR-03 on the 11 Jun 2026 spill of 6.8 bbl", () => {
    const [spill] = rowsOf(
      `SELECT * FROM spill_compliance WHERE asset_id = 'WELL-0001' AND discovered_on >= date('2026-10-17', '-12 months')
       AND (sr01_status LIKE 'breached%' OR sr02_status LIKE 'breached%' OR sr03_status LIKE 'breached%')`,
    );

    expect(spill).toMatchObject({
      inspection_id: "INS-0001-0185",
      discovered_at: "2026-06-11T14:30:00Z",
      spill_effective_volume_bbl: 6.8,
      spill_class: "reportable",
      reporting_required: 1,
      report_deadline_hours: 24,
      report_event_id: "REG-0001-001",
      hours_to_report: 41,
      sr01_status: "breached_late",
      repair_id: "MNT-0001-029",
      report_file: "maintenance-reports/MNT-0001-june-2026-flowline-spill.md",
      containment_hours: 7,
      containment_limit_hours: 4,
      sr02_status: "breached_late",
      sr03_required: 1,
      sr03_due_on: "2026-08-10",
      sr03_event_id: "REG-0001-003",
      sr03_status: "breached_open",
      report_stated_class: "reportable",
      class_mismatch: 0,
    });
  });

  it("breaches RC-04: the notice of violation needed a response by 30 Jul 2026, and none is recorded", () => {
    expect(
      rowsOf(
        `SELECT event_id, protocol_id, fine_usd, status, response_due_on, response_event_id, rc04_status FROM regulator_events
         WHERE asset_id = 'WELL-0001' AND event_type = 'notice_of_violation'`,
      ),
    ).toEqual([
      { event_id: "REG-0001-002", protocol_id: "SR-01", fine_usd: 5000, status: "open", response_due_on: "2026-07-30", response_event_id: null, rc04_status: "breached_open" },
    ]);
  });

  it("has USD 5,000 in open fines", () => {
    expect(rowsOf("SELECT SUM(fine_usd) AS usd FROM regulator_events WHERE asset_id = 'WELL-0001' AND status = 'open'")).toEqual([{ usd: 5000 }]);
  });

  it("met RC-02: the flowline passed its yearly integrity test on 7 Mar 2026", () => {
    expect(
      rowsOf("SELECT maintenance_id, started_on FROM repairs WHERE asset_id = 'WELL-0001' AND issue = 'Annual flowline integrity test' AND started_on >= '2026-01-01'"),
    ).toEqual([{ maintenance_id: "MNT-0001-026", started_on: "2026-03-07" }]);
  });

  it("finds a response filed in time as RC-04 met", () => {
    expect(
      rowsOf("SELECT response_due_on, response_event_id, rc04_status FROM regulator_events WHERE event_id = 'REG-0013-002'"),
    ).toEqual([{ response_due_on: "2026-07-27", response_event_id: "REG-0013-003", rc04_status: "met" }]);
  });

  it("lists the root-cause analysis due on the flowline as an open action: from MNT-0001-028, -029 and -032", () => {
    expect(
      rowsOf("SELECT corrective_repairs, repair_ids, needs_rca FROM rca_candidates WHERE asset_id = 'WELL-0001' AND equipment_kind = 'flowline'"),
    ).toEqual([{ corrective_repairs: 3, repair_ids: "MNT-0001-028, MNT-0001-029, MNT-0001-032", needs_rca: 1 }]);
  });

  it("met SR-01 and SR-02 on the October spill, which needed no report", () => {
    expect(
      rowsOf("SELECT reporting_required, sr01_status, sr02_status, sr03_status FROM spill_compliance WHERE inspection_id = 'INS-0001-0201'"),
    ).toEqual([{ reporting_required: 0, sr01_status: "not_required", sr02_status: "met", sr03_status: "not_required" }]);
  });
});

describe("Q10: Southwest Block 24's spills in the last 90 days not contained within the SOP limit", () => {
  it("finds WELL-0082 at about 7.1 h and WELL-0100 at about 8.1 h, against 4 h", () => {
    const late = rowsOf(
      `SELECT asset_id, inspection_id, repair_id, containment_hours, containment_limit_hours FROM spill_compliance
       WHERE area_name = 'Southwest Block 24' AND discovered_on >= date('2026-10-17', '-90 days') AND discovered_on <= '2026-10-17'
       AND sr02_status LIKE 'breached%' ORDER BY asset_id`,
    );

    expect(late).toEqual([
      { asset_id: "WELL-0082", inspection_id: "INS-0082-0198", repair_id: "MNT-0082-028", containment_hours: 7.1, containment_limit_hours: 4 },
      { asset_id: "WELL-0100", inspection_id: "INS-0100-0196", repair_id: "MNT-0100-034", containment_hours: 8.1, containment_limit_hours: 4 },
    ]);
  });
});

describe("Q14: wells needing a root-cause analysis", () => {
  it("finds WELL-0108, WELL-0121 and WELL-0138 in Northeast Block 7, with 3 corrective pump jack repairs each, by the T200 manual", () => {
    const candidates = rowsOf(
      `SELECT asset_id, corrective_repairs, rca_threshold, rule_source, rule_document, rule_section FROM rca_candidates
       WHERE area_name = 'Northeast Block 7' AND equipment_kind = 'pump_jack' AND needs_rca ORDER BY asset_id`,
    );

    expect(candidates).toEqual(
      ["WELL-0108", "WELL-0121", "WELL-0138"].map((asset_id) => ({
        asset_id, corrective_repairs: 3, rca_threshold: 3, rule_source: "manual", rule_document: "OM-T200", rule_section: "10",
      })),
    );
  });

  it("keeps the wells below the count, such as WELL-0120 and WELL-0102 with 2 repairs", () => {
    expect(
      rowsOf("SELECT asset_id, corrective_repairs, needs_rca FROM rca_candidates WHERE asset_id IN ('WELL-0102', 'WELL-0120') AND equipment_kind = 'pump_jack' ORDER BY asset_id"),
    ).toEqual([
      { asset_id: "WELL-0102", corrective_repairs: 2, needs_rca: 0 },
      { asset_id: "WELL-0120", corrective_repairs: 2, needs_rca: 0 },
    ]);
  });
});

describe("rules parsed from the SOPs", () => {
  const ruleFor = (key: string) => fleet.rules().find((r) => r.wellType === "*" && r.key === key);

  it.each([
    ["sr01_notice_hours", 24, "SOP-SR"],
    ["sr01_major_notice_hours", 2, "SOP-SR"],
    ["sr02_containment_hours", 4, "SOP-SR"],
    ["sr03_verification_days", 60, "SOP-SR"],
    ["rc01_inspection_interval_days", 14, "SOP-RC"],
    ["rc02_flowline_tests_per_year", 1, "SOP-RC"],
    ["rc04_response_days", 30, "SOP-RC"],
  ])("reads %s = %d from %s", (key, value, document) => {
    expect(ruleFor(key)).toMatchObject({ value, document });
  });
});

describe("notes become knowledge entries", () => {
  it("links a feedback note to the inspection named in its text, and a correction through its field", () => {
    const links = rowsOf(
      "SELECT note_id, inspection_id, kind, status, origin FROM notes WHERE asset_id IN ('WELL-0101', 'WELL-0001') AND inspection_id IS NOT NULL ORDER BY note_id",
    );

    expect(links).toEqual([
      { note_id: "CTX-0001-001", inspection_id: "INS-0001-0070", kind: "correction", status: "accepted", origin: "dataset" },
      { note_id: "CTX-0101-002", inspection_id: "INS-0101-0197", kind: "note", status: "disputed", origin: "dataset" },
      { note_id: "CTX-0101-003", inspection_id: "INS-0101-0197", kind: "note", status: "disputed", origin: "dataset" },
    ]);
  });
});

describe("loading several dataset roots", () => {
  /** A scratch dataset: the sample's fleet files plus the given wells copied from it. */
  const scratchRoot = (wells: string[]) => {
    const root = mkdtempSync(join(tmpdir(), "copilot-root-"));
    cpSync(join(SAMPLE_DATA_DIR, "fleet"), join(root, "fleet"), { recursive: true });
    for (const well of wells) cpSync(join(SAMPLE_DATA_DIR, "assets", well), join(root, "assets", well), { recursive: true });
    return root;
  };
  const jsonl = (rows: object[]) => rows.map((r) => JSON.stringify(r)).join("\n") + "\n";

  it("upserts by ID with later roots winning, and adds what the later root brings", () => {
    const base = scratchRoot(["WELL-0001"]);
    const extra = mkdtempSync(join(tmpdir(), "copilot-extra-"));
    const knowledgePath = join(base, "k.db");
    try {
      mkdirSync(join(extra, "fleet"), { recursive: true });
      mkdirSync(join(extra, "assets/WELL-0001"), { recursive: true });
      // The test set extends WELL-0001: a newer status, one more repair, and one more note.
      const meta = JSON.parse(readFileSync(join(SAMPLE_DATA_DIR, "assets/WELL-0001/metadata.json"), "utf-8"));
      writeFileSync(join(extra, "assets/WELL-0001/metadata.json"), JSON.stringify({ ...meta, recorded_status: "down" }));
      writeFileSync(
        join(extra, "assets/WELL-0001/maintenance.jsonl"),
        jsonl([
          {
            maintenance_id: "MNT-0001-999", asset_id: "WELL-0001", started_at: "2026-10-16T08:00:00Z", completed_at: "2026-10-30T00:00:00Z",
            maintenance_type: "corrective", equipment_kind: "pump_jack", issue: "Belt failure", action_taken: null,
            technician_user_id: "U-302", contractor: null, downtime_hours: 10,
            cost_usd: { labor: 1, parts: 2, total: 3 }, triggered_by_inspection_id: null, report_file: null,
          },
        ]),
      );
      writeFileSync(
        join(extra, "assets/WELL-0001/context.jsonl"),
        jsonl([
          { asset_id: "WELL-0001", note_id: "CTX-0001-003", created_at: "2026-10-09T06:40:00Z", author_user_id: "U-102", note_type: "operator_feedback", text: "Replaced by the test set.", valid_from: "2026-10-07", valid_to: null },
        ]),
      );

      const summary = loadDataset({ roots: [base, extra], dbPath: join(base, "m.db"), knowledgePath });
      const merged = openFleet(join(base, "m.db"), { knowledgePath, asOf: "2026-10-17" });
      try {
        expect(summary.wells).toBe(1);
        expect(merged.wellSnapshot("WELL-0001")?.recordedStatus).toBe("down");
        expect(merged.wellSnapshot("WELL-0001")?.openRepairs.map((r) => r.maintenanceId)).toEqual(["MNT-0001-999"]);
        expect(merged.query("SELECT text FROM notes WHERE note_id = 'CTX-0001-003'").rows).toEqual([{ text: "Replaced by the test set." }]);
        expect(merged.query("SELECT COUNT(*) AS n FROM notes WHERE asset_id = 'WELL-0001'").rows).toEqual([{ n: 3 }]);
        expect(merged.query("SELECT COUNT(*) AS n FROM effective_inspections WHERE asset_id = 'WELL-0001'").rows[0]?.n).toBeGreaterThan(200);
      } finally {
        merged.close();
      }
    } finally {
      rmSync(base, { recursive: true, force: true });
      rmSync(extra, { recursive: true, force: true });
    }
  });

  it("replaces only dataset-origin knowledge on a reload", () => {
    const root = scratchRoot(["WELL-0001"]);
    const knowledgePath = join(root, "k.db");
    const dbPath = join(root, "m.db");
    try {
      loadDataset({ roots: [root], dbPath, knowledgePath });
      const store = openKnowledgeStore(knowledgePath);
      store.exec(
        `INSERT INTO knowledge_entries (entry_id, kind, scope, asset_id, text, author_user_id, created_at, valid_from, status, origin)
         VALUES ('K-1', 'claim', 'well', 'WELL-0001', 'Back online since 14 Oct.', 'U-102', '2026-10-17T09:00:00Z', '2026-10-14', 'unconfirmed', 'chat')`,
      );
      store.close();
      // The reloaded dataset no longer carries WELL-0001's notes.
      rmSync(join(root, "assets/WELL-0001/context.jsonl"));

      loadDataset({ roots: [root], dbPath, knowledgePath });
      const reloaded = openFleet(dbPath, { knowledgePath, asOf: "2026-10-17" });
      try {
        expect(reloaded.query("SELECT note_id, origin FROM notes WHERE asset_id = 'WELL-0001'").rows).toEqual([
          { note_id: "K-1", origin: "chat" },
        ]);
        // With the dataset correction gone, the rainwater detection counts as a spill again.
        expect(reloaded.query("SELECT is_spill FROM effective_inspections WHERE inspection_id = 'INS-0001-0070'").rows).toEqual([{ is_spill: 1 }]);
      } finally {
        reloaded.close();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("loading", () => {
  it("fails naming the SOP when the spill classes can't be found in it", () => {
    const root = mkdtempSync(join(tmpdir(), "copilot-nosop-"));
    try {
      cpSync(join(SAMPLE_DATA_DIR, "fleet/well-types"), join(root, "fleet/well-types"), { recursive: true });
      mkdirSync(join(root, "fleet/sops"), { recursive: true });
      writeFileSync(join(root, "fleet/sops/spill-response-sop.md"), "Document ID: SOP-SR\n\n## 1. Purpose\n\nNo classes here.\n");
      cpSync(join(SAMPLE_DATA_DIR, "assets/WELL-0001"), join(root, "assets/WELL-0001"), { recursive: true });
      expect(() =>
        loadDataset({ roots: [root], dbPath: join(root, "x.db"), knowledgePath: join(root, "k.db") }),
      ).toThrow(/SOP-SR.*spill class/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails naming the SOP when one of its protocol rules can't be found", () => {
    const root = mkdtempSync(join(tmpdir(), "copilot-norc04-"));
    try {
      cpSync(join(SAMPLE_DATA_DIR, "fleet"), join(root, "fleet"), { recursive: true });
      const rcPath = join(root, "fleet/sops/regulatory-compliance-sop.md");
      writeFileSync(rcPath, readFileSync(rcPath, "utf-8").replace(/^\| \*\*RC-04\*\*.*$/m, ""));
      cpSync(join(SAMPLE_DATA_DIR, "assets/WELL-0001"), join(root, "assets/WELL-0001"), { recursive: true });
      expect(() =>
        loadDataset({ roots: [root], dbPath: join(root, "x.db"), knowledgePath: join(root, "k.db") }),
      ).toThrow(/RC-04.*SOP-RC/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

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
      expect(() => loadDataset({ roots: [root], dbPath: join(root, "bad.db"), knowledgePath: join(root, "bad-knowledge.db") })).toThrow(/OM-T900/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("shared knowledge: recorded through the fleet, applied for everyone", () => {
  let overlayDir: string;
  let overlay: Fleet;
  let overlayDb: string;
  let overlayKnowledge: string;

  beforeEach(() => {
    overlayDir = mkdtempSync(join(tmpdir(), "copilot-overlay-"));
    overlayDb = join(overlayDir, "copilot.db");
    overlayKnowledge = join(overlayDir, "knowledge.db");
    loadDataset({ roots: [SAMPLE_DATA_DIR], dbPath: overlayDb, knowledgePath: overlayKnowledge });
    overlay = openFleet(overlayDb, { knowledgePath: overlayKnowledge, asOf: "2026-10-17" });
  });

  afterEach(() => {
    overlay.close();
    rmSync(overlayDir, { recursive: true, force: true });
  });

  const overlayRows = (sql: string) => overlay.query(sql).rows;
  const MICHAEL = "U-201";

  describe("naming the author", () => {
    it("finds a user by ID or by name, ignoring case, and nobody else", () => {
      expect(overlay.findUser("U-201")).toEqual({ userId: "U-201", name: "Michael Turner", role: "production_supervisor" });
      expect(overlay.findUser("  michael turner ")?.userId).toBe("U-201");
      expect(overlay.findUser("Michael")).toBeUndefined();
    });
  });

  describe("Q12: Michael Turner corrects WELL-0164's 15 Oct reading to 41.0 °C", () => {
    const correct = () =>
      overlay.recordKnowledge({
        kind: "correction",
        authorUserId: MICHAEL,
        inspectionId: "INS-0164-0205",
        field: "wellhead_temp_c",
        value: 41.0,
        reason: "The handheld thermal gun was faulty; the field crew re-measured the wellhead.",
      });

    it("makes WELL-0164 producing and shows that in the effect", () => {
      const { effect } = correct();

      expect(effect?.before).toMatchObject({ producing: false, deltaC: 4.1 });
      expect(effect?.after).toMatchObject({ producing: true, deltaC: 21.1 });
      expect(effect?.changed).toContain("producing");
    });

    it("flags the inspector's \"Pump jack not moving.\" remark as a conflict for Michael Turner to confirm", () => {
      const { conflicts } = correct();

      expect(conflicts).toEqual([
        expect.objectContaining({
          source: "inspector_remark",
          id: "INS-0164-0205",
          text: "Pump jack not moving.",
          authorName: "Tyler Hughes",
        }),
      ]);
    });

    it("reports no conflict when the correction changes no outcome", () => {
      const { conflicts } = overlay.recordKnowledge({
        kind: "correction",
        authorUserId: MICHAEL,
        inspectionId: "INS-0164-0205",
        field: "wellhead_temp_c",
        value: 24.5,
        reason: "Re-read the gauge.",
      });

      expect(conflicts).toEqual([]);
    });

    it("keeps the original 24.0 °C and names who corrected it and why", () => {
      correct();

      expect(
        overlayRows("SELECT wellhead_temp_c, wellhead_temp_c_original, corrected_fields, producing FROM effective_inspections WHERE inspection_id = 'INS-0164-0205'"),
      ).toEqual([{ wellhead_temp_c: 41, wellhead_temp_c_original: 24, corrected_fields: "wellhead_temp_c", producing: 1 }]);
      expect(
        overlayRows("SELECT field, original_value, corrected_value, author_name, origin, reason FROM corrections WHERE inspection_id = 'INS-0164-0205'"),
      ).toEqual([
        {
          field: "wellhead_temp_c",
          original_value: 24,
          corrected_value: 41,
          author_name: "Michael Turner",
          origin: "chat",
          reason: "The handheld thermal gun was faulty; the field crew re-measured the wellhead.",
        },
      ]);
    });

    it("drops WELL-0164 from Q2's list, leaving 0170, 0172 and 0175", () => {
      correct();

      const wells = overlayRows(
        "SELECT asset_id FROM latest_inspections WHERE area_name = 'Northeast Block 8' AND NOT producing ORDER BY asset_id",
      );
      expect(wells.map((w) => w.asset_id)).toEqual(["WELL-0170", "WELL-0172", "WELL-0175"]);
    });
  });

  describe("corrections to the other fields", () => {
    it("re-classes a spill from a measured volume and keeps the AI's estimate for reference (WELL-0151)", () => {
      const recorded = overlay.recordKnowledge({
        kind: "correction",
        authorUserId: MICHAEL,
        inspectionId: "INS-0151-0201",
        field: "spill_est_volume_bbl",
        value: 5.4,
        reason: "The field crew measured 5.4 bbl.",
      });

      expect(recorded.originalValue).toBe(4.5);
      expect(recorded.effect?.before).toMatchObject({ spillClass: "moderate", effectiveVolumeBbl: 4.5 });
      expect(recorded.effect?.after).toMatchObject({ spillClass: "reportable", effectiveVolumeBbl: 5.4 });
      expect(
        overlayRows("SELECT e.spill_est_volume_bbl, e.spill_effective_volume_bbl, e.spill_class, e.corrected_by_name FROM spills s JOIN effective_inspections e ON e.inspection_id = s.inspection_id WHERE s.inspection_id = 'INS-0151-0201'"),
      ).toEqual([{ spill_est_volume_bbl: 4.5, spill_effective_volume_bbl: 5.4, spill_class: "reportable", corrected_by_name: "Michael Turner" }]);
    });

    it("takes a spill out of the statistics when its detection is corrected to false", () => {
      const before = overlayRows("SELECT COUNT(*) AS n FROM spills WHERE asset_id = 'WELL-0001'")[0]?.n;
      const recorded = overlay.recordKnowledge({
        kind: "correction",
        authorUserId: MICHAEL,
        inspectionId: "INS-0001-0021",
        field: "spill_detected",
        value: false,
        reason: "Washout water, not oil.",
      });

      expect(recorded.effect?.changed).toContain("isSpill");
      expect(overlayRows("SELECT COUNT(*) AS n FROM spills WHERE asset_id = 'WELL-0001'")[0]?.n).toBe((before as number) - 1);
    });

    it("applies a corrected air temperature to the delta", () => {
      const recorded = overlay.recordKnowledge({
        kind: "correction",
        authorUserId: MICHAEL,
        inspectionId: "INS-0164-0205",
        field: "ambient_temp_c",
        value: 9.9,
        reason: "The weather station was reading the wrong sensor.",
      });

      expect(recorded.effect?.after).toMatchObject({ ambientTempC: 9.9, deltaC: 14.1 });
      expect(overlayRows("SELECT ambient_temp_c_original FROM effective_inspections WHERE inspection_id = 'INS-0164-0205'")).toEqual([
        { ambient_temp_c_original: 19.9 },
      ]);
    });
  });

  describe("recording refuses what doesn't check out", () => {
    const correction = {
      kind: "correction" as const,
      authorUserId: MICHAEL,
      inspectionId: "INS-0164-0205",
      field: "wellhead_temp_c" as const,
      value: 41,
      reason: "Re-measured.",
    };

    it.each([
      ["an unknown inspection", { inspectionId: "INS-9999-0001" }, /No inspection with ID INS-9999-0001/],
      ["an unknown user", { authorUserId: "U-999" }, /No user with ID U-999/],
      ["a field that can't be corrected", { field: "inspector_user_id" as any }, /wellhead_temp_c, ambient_temp_c, spill_detected, spill_est_volume_bbl/],
      ["a missing reason", { reason: "  " }, /reason/],
      ["a value that isn't a number", { value: Number.NaN }, /number/],
    ])("rejects %s and stores nothing", (_name, change, message) => {
      expect(() => overlay.recordKnowledge({ ...correction, ...change })).toThrow(message);
      expect(overlayRows("SELECT COUNT(*) AS n FROM corrections WHERE origin = 'chat'")).toEqual([{ n: 0 }]);
    });

    it("rejects a volume correction where no spill stands", () => {
      expect(() =>
        overlay.recordKnowledge({ ...correction, field: "spill_est_volume_bbl", value: 5 }),
      ).toThrow(/no spill/i);
    });
  });

  describe("Q15: Jessica Reed sees WELL-0164 as producing, attributed to Michael Turner", () => {
    const correctWellhead = () =>
      overlay.recordKnowledge({
        kind: "correction",
        authorUserId: MICHAEL,
        inspectionId: "INS-0164-0205",
        field: "wellhead_temp_c",
        value: 41.0,
        reason: "The handheld thermal gun was faulty; the field crew re-measured the wellhead.",
      });

    it("shows the corrected reading, its original and who corrected it, beside the inspector's remark", () => {
      correctWellhead();

      const latest = overlay.wellSnapshot("WELL-0164")?.latestInspection;
      expect(latest).toMatchObject({ inspectionId: "INS-0164-0205", wellheadTempC: 41, deltaC: 21.1, producing: true, notes: "Pump jack not moving." });
      expect(latest?.corrections).toEqual([
        expect.objectContaining({
          field: "wellhead_temp_c",
          originalValue: 24,
          correctedValue: 41,
          authorName: "Michael Turner",
          reason: "The handheld thermal gun was faulty; the field crew re-measured the wellhead.",
        }),
      ]);
      expect(overlay.wellSnapshot("WELL-0164")?.statusMismatch).toBe(false);
    });

    it("survives a reload of the dataset", () => {
      correctWellhead();
      overlay.close();

      loadDataset({ roots: [SAMPLE_DATA_DIR], dbPath: overlayDb, knowledgePath: overlayKnowledge });
      overlay = openFleet(overlayDb, { knowledgePath: overlayKnowledge, asOf: "2026-10-17" });

      expect(overlay.wellSnapshot("WELL-0164")?.latestInspection).toMatchObject({ producing: true, wellheadTempC: 41 });
    });
  });

  describe("Q16: Jake Morales shares a planned shut-in for WELL-0007", () => {
    it("shows up in WELL-0007's snapshot for everyone, attributed to Jake Morales", () => {
      const recorded = overlay.recordKnowledge({
        kind: "note",
        authorUserId: "U-102",
        assetId: "WELL-0007",
        text: "WELL-0007 will be shut in from 17 Oct for a 10-day planned workover.",
        validFrom: "2026-10-17",
        validTo: "2026-10-27",
      });

      expect(recorded).toMatchObject({ status: "accepted", conflicts: [], effect: null });
      const shared = overlay.wellSnapshot("WELL-0007")?.validNotes.find((n) => n.noteId === recorded.entryId);
      expect(shared).toMatchObject({
        kind: "note",
        authorName: "Jake Morales",
        origin: "chat",
        status: "accepted",
        validFrom: "2026-10-17",
        validTo: "2026-10-27",
      });
      expect(shared?.text).toMatch(/10-day planned workover/);
    });

    it("leaves a note out once its period has passed, and refuses a well that doesn't exist", () => {
      const past = overlay.recordKnowledge({
        kind: "note",
        authorUserId: "U-102",
        assetId: "WELL-0007",
        text: "Shut in for a workover.",
        validFrom: "2026-09-01",
        validTo: "2026-09-10",
      });

      expect(overlay.wellSnapshot("WELL-0007")?.validNotes.map((n) => n.noteId)).not.toContain(past.entryId);
      expect(() => overlay.recordKnowledge({ kind: "note", authorUserId: "U-102", assetId: "WELL-9999", text: "x" })).toThrow(
        /No well with ID WELL-9999/,
      );
    });
  });

  describe("Q17: claims the data contradicts", () => {
    const claim = (authorUserId: string, assetId: string, text: string, assertsProducing: boolean, validFrom?: string) =>
      overlay.recordKnowledge({ kind: "claim", authorUserId, assetId, text, assertsProducing, validFrom });

    it("keeps a claim the inspection supports as accepted, with nothing to confirm", () => {
      const recorded = claim("U-201", "WELL-0175", "WELL-0175 has been shut in for planned work since 14 Oct.", false, "2026-10-14");

      expect(recorded).toMatchObject({ status: "accepted", conflicts: [] });
    });

    it("stores Tyler Hughes's 'running fine' as unconfirmed, cites the 15 Oct inspection, and changes nothing", () => {
      claim("U-201", "WELL-0175", "WELL-0175 has been shut in for planned work since 14 Oct.", false, "2026-10-14");
      const recorded = claim("U-204", "WELL-0175", "WELL-0175 is running fine.", true);

      expect(recorded.status).toBe("unconfirmed");
      expect(recorded.effect).toBeNull();
      expect(recorded.conflicts).toEqual([
        expect.objectContaining({ source: "latest_inspection", id: "INS-0175-0204", authorName: "Jessica Reed" }),
      ]);
      expect(recorded.conflicts[0]?.text).toMatch(/0\.4/);
      // Nothing derived moved: WELL-0175 still isn't producing, and both statements stay on record.
      expect(overlayRows("SELECT producing FROM latest_inspections WHERE asset_id = 'WELL-0175'")).toEqual([{ producing: 0 }]);
      expect(overlay.wellSnapshot("WELL-0175")?.latestInspection.producing).toBe(false);
      expect(
        overlay.wellSnapshot("WELL-0175")?.validNotes.map((n) => [n.authorName, n.kind, n.status]),
      ).toEqual([
        ["Michael Turner", "claim", "accepted"],
        ["Tyler Hughes", "claim", "unconfirmed"],
      ]);
    });

    it("records Jake Morales's 'WELL-0001 back online' as unconfirmed against the 15 Oct inspection, leaving the note that expects a return around 20 Oct in view", () => {
      const recorded = claim("U-102", "WELL-0001", "WELL-0001 is back online since 14 Oct.", true, "2026-10-14");

      expect(recorded.status).toBe("unconfirmed");
      expect(recorded.conflicts).toEqual([expect.objectContaining({ source: "latest_inspection", id: "INS-0001-0203" })]);
      const notes = overlay.wellSnapshot("WELL-0001")?.validNotes ?? [];
      expect(notes.find((n) => n.noteId === "CTX-0001-003")?.text).toMatch(/Expected back online around 20 Oct/);
      expect(notes.find((n) => n.noteId === recorded.entryId)).toMatchObject({ kind: "claim", status: "unconfirmed" });
    });
  });

  describe("Q18: disputed notes are shown, and the detection still stands", () => {
    it("marks INS-0101-0197 disputed by Ryan Brooks's and Chris Dalton's notes, and still counts it as a spill", () => {
      expect(overlayRows("SELECT inspection_id, note_ids, authors FROM disputes")).toEqual([
        { inspection_id: "INS-0101-0197", note_ids: "CTX-0101-002, CTX-0101-003", authors: "Ryan Brooks, Chris Dalton" },
      ]);
      expect(overlayRows("SELECT disputed, is_spill FROM effective_inspections WHERE inspection_id = 'INS-0101-0197'")).toEqual([
        { disputed: 1, is_spill: 1 },
      ]);
      expect(overlayRows("SELECT inspection_id FROM spills WHERE inspection_id = 'INS-0101-0197'")).toHaveLength(1);
      expect(overlayRows("SELECT note_id, status FROM notes WHERE inspection_id = 'INS-0101-0197' ORDER BY note_id")).toEqual([
        { note_id: "CTX-0101-002", status: "disputed" },
        { note_id: "CTX-0101-003", status: "disputed" },
      ]);
      expect(overlay.wellSnapshot("WELL-0101")?.validNotes.filter((n) => n.status === "disputed").map((n) => n.noteId)).toEqual([
        "CTX-0101-002",
        "CTX-0101-003",
      ]);
    });

    it("leaves an inspection with a single note undisputed", () => {
      overlay.recordKnowledge({ kind: "note", authorUserId: "U-101", assetId: "WELL-0001", inspectionId: "INS-0001-0185", text: "Looked like crude to me." });

      expect(overlayRows("SELECT disputed FROM effective_inspections WHERE inspection_id = 'INS-0001-0185'")).toEqual([{ disputed: 0 }]);
    });

    it("disputes an inspection when a second person's note about it is recorded, and returns the first as a conflict", () => {
      const first = overlay.recordKnowledge({ kind: "note", authorUserId: "U-101", assetId: "WELL-0001", inspectionId: "INS-0001-0185", text: "Inspection INS-0001-0185: crude oil." });
      expect(first.conflicts).toEqual([]);

      const second = overlay.recordKnowledge({ kind: "note", authorUserId: "U-103", assetId: "WELL-0001", inspectionId: "INS-0001-0185", text: "Only produced water." });

      expect(second.conflicts).toEqual([expect.objectContaining({ source: "note", id: first.entryId, authorName: "Emily Carter" })]);
      expect(overlayRows("SELECT disputed, is_spill FROM effective_inspections WHERE inspection_id = 'INS-0001-0185'")).toEqual([{ disputed: 1, is_spill: 1 }]);
    });

    it("still lets a formal correction take the detection out of the statistics", () => {
      overlay.recordKnowledge({
        kind: "correction",
        authorUserId: "U-402",
        inspectionId: "INS-0101-0197",
        field: "spill_detected",
        value: false,
        reason: "Lab result: produced water.",
      });

      expect(overlayRows("SELECT disputed, is_spill FROM effective_inspections WHERE inspection_id = 'INS-0101-0197'")).toEqual([
        { disputed: 1, is_spill: 0 },
      ]);
    });
  });
});
