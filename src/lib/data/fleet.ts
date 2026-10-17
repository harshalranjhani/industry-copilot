import { constants, DatabaseSync } from "node:sqlite";
import { addChatEntry, openKnowledgeStore } from "./knowledge";
import type { ComplianceCheck } from "./reports";
import { VIEW_DOCS, viewsSql } from "./schema";

export interface WellSnapshot {
  assetId: string;
  name: string | null;
  wellType: string;
  areaName: string | null;
  location: { lat: number; lon: number } | null;
  recordedStatus: string | null;
  /** True when the recorded status disagrees with the latest inspection. */
  statusMismatch: boolean;
  latestInspection: {
    inspectionId: string;
    inspectedAt: string;
    method: string | null;
    inspectorName: string | null;
    ambientTempC: number;
    wellheadTempC: number;
    /** Wellhead minus ambient, in °C. */
    deltaC: number;
    producing: boolean;
    notes: string | null;
    /** True when people's notes about this inspection disagree: show both sides; the detection stands. */
    disputed: boolean;
    /** Corrections applied to this inspection, each with the original value beside the new one. */
    corrections: {
      correctionId: string;
      field: string;
      originalValue: number | null;
      correctedValue: number;
      authorName: string | null;
      reason: string | null;
      createdAt: string | null;
      origin: string;
    }[];
  };
  /** Repairs still in progress at AS_OF: the first place to look for why a well stopped. */
  openRepairs: {
    maintenanceId: string;
    maintenanceType: string | null;
    equipmentKind: string | null;
    issue: string | null;
    startedAt: string;
    /** The planned end, after AS_OF while the repair is open. */
    plannedEnd: string | null;
  }[];
  /** Notes (and corrections) from the knowledge store that are valid at AS_OF. */
  validNotes: {
    noteId: string;
    kind: string;
    noteType: string | null;
    /** accepted, unconfirmed (a claim the data contradicts) or disputed. */
    status: string;
    /** dataset, or chat for what users taught the copilot. */
    origin: string;
    authorName: string | null;
    createdAt: string | null;
    validFrom: string | null;
    validTo: string | null;
    inspectionId: string | null;
    text: string | null;
  }[];
  /** The manual rule the producing flag was judged against, for citation. */
  producingRule: { thresholdC: number; document: string; section: string };
}

export interface StoredRule {
  wellType: string;
  key: string;
  value: number;
  unit: string;
  document: string;
  section: string;
}

export interface StoredDocument {
  path: string;
  kind: "manual" | "sop";
  documentId: string;
  text: string;
}

export interface RepairReport {
  maintenanceId: string;
  assetId: string;
  reportFile: string;
  /** Hours from discovery to containment, as the report states it, or null. */
  containmentHours: number | null;
  /** The spill class the report states, or null. */
  statedClass: string | null;
  /** The report's compliance check, row by row. */
  checks: ComplianceCheck[];
  text: string;
}

export interface ReportSearchHit {
  maintenanceId: string;
  assetId: string;
  reportFile: string;
  /** The matching passage, with matched words in [brackets]. */
  snippet: string;
}

/** A query the model can fix: the message says what was wrong. */
export class QueryError extends Error {}

/** A recording the model can fix: the message says what was wrong with the target or the value. */
export class KnowledgeError extends Error {}

/** The rules a team may override per well type: only those a view applies. */
export const OVERRIDABLE_RULES = ["rca_corrective_count"] as const;
export type OverridableRule = (typeof OVERRIDABLE_RULES)[number];

/** The inspection fields a correction may change. */
export const CORRECTABLE_FIELDS = ["wellhead_temp_c", "ambient_temp_c", "spill_detected", "spill_est_volume_bbl"] as const;
export type CorrectableField = (typeof CORRECTABLE_FIELDS)[number];

/** What a user teaches the copilot. Corrections apply at once; see Fleet.recordKnowledge. */
export type KnowledgeInput =
  | {
      kind: "correction";
      authorUserId: string;
      inspectionId: string;
      field: CorrectableField;
      /** The new value; a boolean for spill_detected. */
      value: number | boolean;
      reason: string;
    }
  | {
      kind: "note";
      authorUserId: string;
      assetId: string;
      text: string;
      /** The inspection the note is about, when it is about one. */
      inspectionId?: string;
      /** YYYY-MM-DD; a note is valid from/to these dates, inclusive. */
      validFrom?: string;
      validTo?: string;
    }
  | {
      kind: "rule_override";
      authorUserId: string;
      /** The one well type the rule applies to. */
      wellType: string;
      ruleKey: OverridableRule;
      /** The team's value for the rule, replacing the manual's for every well of that type. */
      value: number;
      text: string;
      reason?: string;
    }
  | {
      kind: "claim";
      authorUserId: string;
      assetId: string;
      text: string;
      /** What the claim says about the well's state: true = producing, false = not producing. Leave out when it says nothing about that. */
      assertsProducing?: boolean;
      validFrom?: string;
      validTo?: string;
    };

/** Evidence on the same target that disagrees with what was just recorded: the model surfaces it and asks the user to confirm. */
export interface KnowledgeConflict {
  source: "inspector_remark" | "latest_inspection" | "note" | "claim";
  /** The inspection (for a remark or the latest inspection) or the entry's ID. */
  id: string;
  text: string;
  authorName: string | null;
}

/** Derived results of one inspection, before or after an entry. */
export interface DerivedInspection {
  wellheadTempC: number;
  ambientTempC: number;
  deltaC: number;
  producing: boolean;
  isSpill: boolean;
  spillClass: string | null;
  effectiveVolumeBbl: number | null;
}

/** One spill's Spill Response SOP duties, before or after an entry. */
export interface DerivedCompliance {
  spillClass: string;
  reportingRequired: boolean;
  /** When the SR-01 written notice was due, or null when no report is required. */
  reportDueAt: string | null;
  sr01Status: string;
  sr02Status: string;
  /** When SR-03 agency verification is due, or null when not required. */
  sr03DueOn: string | null;
  sr03Status: string;
  /** The repair whose report covers the spill. */
  repairId: string | null;
  /** The class that report states; it no longer holds when classMismatch. */
  reportStatedClass: string | null;
  classMismatch: boolean;
}

/** What a rule override changed: the rule's value and the wells whose root-cause analysis duty flipped. */
export interface RuleEffect {
  wellType: string;
  ruleKey: OverridableRule;
  /** The effective value before and after (the manual's, or an earlier override). */
  before: number;
  after: number;
  /** Wells and equipment kinds whose needs_rca differs: root-cause analyses newly due or no longer due. */
  rcaChanges: { assetId: string; equipmentKind: string; correctiveRepairs: number; neededBefore: boolean; needsNow: boolean }[];
}

export interface RecordedKnowledge {
  entryId: string;
  kind: KnowledgeInput["kind"];
  /** accepted, or unconfirmed for a claim the data contradicts. */
  status: "accepted" | "unconfirmed";
  /** The value the dataset has for a corrected field, kept beside the new one. */
  originalValue: number | null;
  /** Other evidence on the same target that disagrees with the entry. */
  conflicts: KnowledgeConflict[];
  /** What the entry changed in the inspection it targets; null when it targets no inspection. */
  effect: {
    inspectionId: string;
    before: DerivedInspection;
    after: DerivedInspection;
    /** The derived results that differ, e.g. ["producing", "deltaC"]. */
    changed: (keyof DerivedInspection)[];
    /** The spill's compliance before and after (either is null while no spill stands); null when the inspection has no spill either way. */
    compliance: { before: DerivedCompliance | null; after: DerivedCompliance | null } | null;
  } | null;
  /** What a rule override changed; null for every other kind. */
  ruleEffect: RuleEffect | null;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  /** True when more rows matched than `maxRows`, so the rest were left out. */
  truncated: boolean;
}

export const DEFAULT_MAX_ROWS = 200;

const VIEW_NAMES = new Set(VIEW_DOCS.map((v) => v.name));
const VIEW_LIST = [...VIEW_NAMES].join(", ");

export interface FleetOptions {
  /** The knowledge store whose entries the views apply. */
  knowledgePath: string;
  /** The "today" that open repairs and valid notes are judged against. */
  asOf: string;
}

export interface Fleet {
  /**
   * Runs one read-only SELECT over the documented views and nothing else.
   * Throws QueryError, with a message the model can act on, for anything else.
   */
  query(sql: string, options?: { maxRows?: number }): QueryResult;
  /** A user of the fleet by exact ID or full name (case-insensitive), or undefined. */
  findUser(nameOrId: string): { userId: string; name: string; role: string } | undefined;
  /**
   * Records what a user taught the copilot, for every user from now on: checks
   * the target exists, stores the entry (original value kept) and returns its
   * effect. Throws KnowledgeError, with a message the model can act on, for a
   * target or value that doesn't check out.
   */
  recordKnowledge(input: KnowledgeInput): RecordedKnowledge;
  /** The well's state at its latest inspection ("right now"), or undefined for an unknown well. */
  wellSnapshot(assetId: string): WellSnapshot | undefined;
  /** A repair's report (resolved through its report_file), or undefined when it has none. */
  report(maintenanceId: string): RepairReport | undefined;
  /** Full-text search over every repair report, best match first. */
  searchReports(text: string, options?: { assetId?: string; limit?: number }): ReportSearchHit[];
  /** Every parsed rule, with the document and section that states it. */
  rules(): StoredRule[];
  /** Full text of every well-type manual and SOP. */
  documents(): StoredDocument[];
  close(): void;
}

type Row = Record<string, any>;

const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;

/**
 * The identifiers and keywords of a SQL statement, lower-cased, in order:
 * string literals and comments are skipped, and quoted identifiers ("x", `x`, [x]) are unquoted.
 */
function sqlWords(sql: string): string[] {
  const words: string[] = [];
  const token = /'(?:[^']|'')*'?|--[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|"((?:[^"]|"")*)"?|`((?:[^`]|``)*)`?|\[([^\]]*)\]?|([A-Za-z_][A-Za-z0-9_$]*)/g;
  for (const match of sql.matchAll(token)) {
    const word = match[1]?.replaceAll('""', '"') ?? match[2]?.replaceAll("``", "`") ?? match[3] ?? match[4];
    if (word !== undefined) words.push(word.toLowerCase());
  }
  return words;
}

/** Opens the data store read-only; every answer goes through these views. */
export function openFleet(dbPath: string, { knowledgePath, asOf }: FleetOptions): Fleet {
  openKnowledgeStore(knowledgePath).close(); // the read-only attach below needs the file to exist
  const db = new DatabaseSync(dbPath, { readOnly: true });
  db.exec(`ATTACH DATABASE ${sqlString(`file:${knowledgePath}?mode=ro`)} AS knowledge`);
  db.exec(viewsSql(asOf));
  // Every base table, in the data store and the knowledge store, plus SQLite's own catalog.
  const baseTables = new Set(["sqlite_master", "sqlite_schema", "sqlite_temp_master", "sqlite_temp_schema"]);
  for (const schema of ["main", "knowledge"]) {
    for (const { name } of db.prepare(`SELECT name FROM ${schema}.sqlite_master WHERE type = 'table'`).all() as Row[]) {
      baseTables.add(String(name).toLowerCase());
    }
  }

  const userName = (userId: unknown): string | null =>
    (db.prepare("SELECT name FROM users WHERE user_id = ?").get(userId as string) as Row | undefined)?.name ?? null;

  const derivedInspection = (inspectionId: string): DerivedInspection => {
    const r = db.prepare("SELECT * FROM effective_inspections WHERE inspection_id = ?").get(inspectionId) as Row;
    return {
      wellheadTempC: r.wellhead_temp_c,
      ambientTempC: r.ambient_temp_c,
      deltaC: r.delta_c,
      producing: Boolean(r.producing),
      isSpill: Boolean(r.is_spill),
      spillClass: r.spill_class,
      effectiveVolumeBbl: r.spill_effective_volume_bbl,
    };
  };

  const derivedCompliance = (inspectionId: string): DerivedCompliance | null => {
    const r = db.prepare("SELECT * FROM spill_compliance WHERE inspection_id = ?").get(inspectionId) as Row | undefined;
    return r
      ? {
          spillClass: r.spill_class,
          reportingRequired: Boolean(r.reporting_required),
          reportDueAt: r.report_due_at,
          sr01Status: r.sr01_status,
          sr02Status: r.sr02_status,
          sr03DueOn: r.sr03_due_on,
          sr03Status: r.sr03_status,
          repairId: r.repair_id,
          reportStatedClass: r.report_stated_class,
          classMismatch: Boolean(r.class_mismatch),
        }
      : null;
  };

  /** Notes (and, with `claims`, claims) by other people about an inspection, named in their field or their text. */
  const othersAbout = (inspectionId: string, authorUserId: string, kinds: ("note" | "claim")[]): KnowledgeConflict[] =>
    (
      db
        .prepare(
          `SELECT k.entry_id, k.kind, k.text, k.author_user_id FROM knowledge.knowledge_entries k
           JOIN knowledge.knowledge_inspection_links l ON l.entry_id = k.entry_id
           WHERE l.inspection_id = ? AND k.kind IN (${kinds.map((k) => `'${k}'`).join(", ")}) AND k.author_user_id IS NOT ?
           ORDER BY k.created_at`,
        )
        .all(inspectionId, authorUserId) as Row[]
    ).map((n) => ({ source: n.kind, id: n.entry_id, text: n.text, authorName: userName(n.author_user_id) }));

  const checkPeriod = (validFrom?: string, validTo?: string) => {
    for (const [name, date] of [["valid_from", validFrom], ["valid_to", validTo]] as const) {
      if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new KnowledgeError(`${name} must be a YYYY-MM-DD date, got "${date}".`);
    }
    if (validFrom && validTo && validTo < validFrom) throw new KnowledgeError("valid_to is before valid_from.");
  };

  const recordCorrection = (input: Extract<KnowledgeInput, { kind: "correction" }>): RecordedKnowledge => {
    const inspection = db.prepare("SELECT * FROM inspections WHERE inspection_id = ?").get(input.inspectionId) as Row | undefined;
    if (!inspection) throw new KnowledgeError(`No inspection with ID ${input.inspectionId}`);
    if (!CORRECTABLE_FIELDS.includes(input.field)) {
      throw new KnowledgeError(`${input.field} can't be corrected. Correctable fields: ${CORRECTABLE_FIELDS.join(", ")}.`);
    }
    if (!input.reason.trim()) throw new KnowledgeError("A correction needs a reason: why is the recorded value wrong?");
    const value = Number(input.value);
    if (typeof input.value === "string" || !Number.isFinite(value)) {
      throw new KnowledgeError(`The corrected value must be a number (or true/false for spill_detected), got ${String(input.value)}.`);
    }
    const before = derivedInspection(input.inspectionId);
    const complianceBefore = derivedCompliance(input.inspectionId);
    if (input.field === "spill_est_volume_bbl" && !before.isSpill) {
      throw new KnowledgeError(`${input.inspectionId} has no spill that stands, so there is no volume to correct.`);
    }
    const originalValue: number | null = inspection[input.field];
    const entryId = addChatEntry(knowledgePath, {
      kind: "correction",
      scope: "inspection_field",
      assetId: inspection.asset_id,
      inspectionId: input.inspectionId,
      field: input.field,
      value,
      originalValue,
      reason: input.reason,
      authorUserId: input.authorUserId,
      status: "accepted",
    });
    const after = derivedInspection(input.inspectionId);
    const complianceAfter = derivedCompliance(input.inspectionId);
    const changed = (Object.keys(after) as (keyof DerivedInspection)[]).filter((key) => before[key] !== after[key]);
    // The inspector's remark and other people's notes about this inspection disagree
    // with a correction that flips its outcome.
    const conflicts: KnowledgeConflict[] = [];
    if (changed.some((key) => key === "producing" || key === "isSpill" || key === "spillClass")) {
      const remark = String(inspection.notes ?? "").trim();
      if (remark) {
        conflicts.push({ source: "inspector_remark", id: input.inspectionId, text: remark, authorName: userName(inspection.inspector_user_id) });
      }
      conflicts.push(...othersAbout(input.inspectionId, input.authorUserId, ["note", "claim"]));
    }
    return { entryId, kind: "correction", status: "accepted", originalValue, conflicts, ruleEffect: null, effect: {
        inspectionId: input.inspectionId,
        before,
        after,
        changed,
        compliance: complianceBefore || complianceAfter ? { before: complianceBefore, after: complianceAfter } : null,
      },
    };
  };

  /** Notes and claims: stored as said. A claim the latest inspection contradicts is stored unconfirmed and changes nothing. */
  const recordStatement = (input: Extract<KnowledgeInput, { kind: "note" | "claim" }>): RecordedKnowledge => {
    const well = db.prepare("SELECT asset_id FROM wells WHERE asset_id = ?").get(input.assetId);
    if (!well) throw new KnowledgeError(`No well with ID ${input.assetId}`);
    if (!input.text.trim()) throw new KnowledgeError("A note or claim needs its text.");
    checkPeriod(input.validFrom, input.validTo);
    if (input.kind === "note" && input.inspectionId) {
      const about = db.prepare("SELECT asset_id FROM inspections WHERE inspection_id = ?").get(input.inspectionId) as Row | undefined;
      if (!about) throw new KnowledgeError(`No inspection with ID ${input.inspectionId}`);
      if (about.asset_id !== input.assetId) throw new KnowledgeError(`${input.inspectionId} is an inspection of ${about.asset_id}, not ${input.assetId}.`);
    }

    const conflicts: KnowledgeConflict[] = [];
    if (input.kind === "note") {
      // Other people's notes about the same inspection disagree by definition: that is a dispute.
      const about = new Set([...(input.text.match(/INS-\d+-\d+/g) ?? []), ...(input.inspectionId ? [input.inspectionId] : [])]);
      for (const inspectionId of about) {
        for (const note of othersAbout(inspectionId, input.authorUserId, ["note"])) {
          if (!conflicts.some((c) => c.id === note.id)) conflicts.push(note);
        }
      }
    }
    let status: RecordedKnowledge["status"] = "accepted";
    if (input.kind === "claim" && input.assertsProducing !== undefined) {
      const latest = db.prepare("SELECT * FROM latest_inspections WHERE asset_id = ?").get(input.assetId) as Row | undefined;
      if (latest && Boolean(latest.producing) !== input.assertsProducing) {
        status = "unconfirmed";
        conflicts.push({
          source: "latest_inspection",
          id: latest.inspection_id,
          text: `Inspected ${latest.inspected_at}: wellhead ${latest.wellhead_temp_c} °C vs air ${latest.ambient_temp_c} °C, ${latest.delta_c} °C above air against a threshold of ${latest.producing_threshold_c} °C, so the well is ${latest.producing ? "producing" : "not producing"}.`,
          authorName: latest.inspector_name,
        });
      }
    }
    const entryId = addChatEntry(knowledgePath, {
      kind: input.kind,
      scope: "well",
      assetId: input.assetId,
      inspectionId: input.kind === "note" ? input.inspectionId : undefined,
      value: input.kind === "claim" && input.assertsProducing !== undefined ? Number(input.assertsProducing) : undefined,
      text: input.text,
      authorUserId: input.authorUserId,
      validFrom: input.validFrom,
      validTo: input.validTo,
      status,
    });
    return { entryId, kind: input.kind, status, originalValue: null, conflicts, effect: null, ruleEffect: null };
  };

  /** The root-cause analysis duty of every well and equipment kind, by well type. */
  const rcaDuties = (wellType: string) =>
    new Map(
      (db.prepare("SELECT asset_id, equipment_kind, corrective_repairs, needs_rca FROM rca_candidates WHERE well_type = ?").all(wellType) as Row[]).map(
        (r) => [`${r.asset_id}|${r.equipment_kind}`, r] as const,
      ),
    );

  /** The value in force for a well type: the latest override, else the manual's. */
  const ruleValue = (wellType: string, ruleKey: string): number =>
    (
      db
        .prepare(
          "SELECT COALESCE(o.value, r.value) AS value FROM rules r LEFT JOIN rule_overrides o ON o.well_type = r.well_type AND o.rule_key = r.key WHERE r.well_type = ? AND r.key = ?",
        )
        .get(wellType, ruleKey) as Row
    ).value;

  /** A team's rule for every well of one type: stored with that scope, applied by the views to that type only. */
  const recordRuleOverride = (input: Extract<KnowledgeInput, { kind: "rule_override" }>): RecordedKnowledge => {
    if (!OVERRIDABLE_RULES.includes(input.ruleKey)) {
      throw new KnowledgeError(`${input.ruleKey} can't be overridden. Overridable rules: ${OVERRIDABLE_RULES.join(", ")}.`);
    }
    if (!db.prepare("SELECT 1 FROM wells WHERE well_type = ? LIMIT 1").get(input.wellType)) {
      throw new KnowledgeError(`No wells of type ${input.wellType}. Ask which well type the rule is for.`);
    }
    if (typeof input.value !== "number" || !Number.isInteger(input.value) || input.value < 1) {
      throw new KnowledgeError(`The count must be a whole number of at least 1, got ${String(input.value)}.`);
    }
    if (!input.text.trim()) throw new KnowledgeError("A rule override needs its text: the instruction in the user's words.");
    const dutiesBefore = rcaDuties(input.wellType);
    const before = ruleValue(input.wellType, input.ruleKey);
    const manualValue = (db.prepare("SELECT value FROM rules WHERE well_type = ? AND key = ?").get(input.wellType, input.ruleKey) as Row).value;
    const entryId = addChatEntry(knowledgePath, {
      kind: "rule_override",
      scope: "well_type",
      wellType: input.wellType,
      ruleKey: input.ruleKey,
      value: input.value,
      originalValue: manualValue,
      text: input.text,
      reason: input.reason,
      authorUserId: input.authorUserId,
      status: "accepted",
    });
    const rcaChanges: RuleEffect["rcaChanges"] = [];
    for (const [key, now] of rcaDuties(input.wellType)) {
      const was = dutiesBefore.get(key);
      if (Boolean(was?.needs_rca) !== Boolean(now.needs_rca)) {
        rcaChanges.push({
          assetId: now.asset_id,
          equipmentKind: now.equipment_kind,
          correctiveRepairs: now.corrective_repairs,
          neededBefore: Boolean(was?.needs_rca),
          needsNow: Boolean(now.needs_rca),
        });
      }
    }
    rcaChanges.sort((a, b) => a.assetId.localeCompare(b.assetId) || a.equipmentKind.localeCompare(b.equipmentKind));
    return {
      entryId,
      kind: "rule_override",
      status: "accepted",
      originalValue: manualValue,
      conflicts: [],
      effect: null,
      ruleEffect: { wellType: input.wellType, ruleKey: input.ruleKey, before, after: ruleValue(input.wellType, input.ruleKey), rcaChanges },
    };
  };

  return {
    query(sql, { maxRows = DEFAULT_MAX_ROWS } = {}) {
      // SQLite's authorizer can't tell a read inside a view from one inside the
      // query's own WITH clause, so a query may not name a base table at all
      // (an alias after AS is fine).
      const words = sqlWords(sql);
      let denied = words.find((word, i) => baseTables.has(word) && !VIEW_NAMES.has(word) && words[i - 1] !== "as");
      if (denied) denied = `table "${denied}"`;
      db.setAuthorizer((action) => {
        if (
          action === constants.SQLITE_SELECT ||
          action === constants.SQLITE_READ ||
          action === constants.SQLITE_FUNCTION ||
          action === constants.SQLITE_RECURSIVE
        ) {
          return constants.SQLITE_OK;
        }
        denied ??= "a statement that is not a plain SELECT";
        return constants.SQLITE_DENY;
      });
      try {
        if (denied) throw new QueryError(denied);
        const statement = db.prepare(sql);
        // prepare() reads only the first statement; anything after it would be silently dropped.
        if (sql.trim().length > statement.sourceSQL.trim().length) {
          throw new QueryError("Run exactly one statement per query.");
        }
        const columns = statement.columns().map((c) => c.name);
        const rows: Row[] = [];
        let truncated = false;
        for (const row of statement.iterate()) {
          if (rows.length >= maxRows) {
            truncated = true;
            break;
          }
          rows.push({ ...row });
        }
        return { columns, rows, truncated };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (denied) {
          throw new QueryError(
            `Not allowed: ${denied}. Run one SELECT over only these views: ${VIEW_LIST}. Base tables, writes and PRAGMA are not available.`,
          );
        }
        throw err instanceof QueryError ? err : new QueryError(message);
      } finally {
        db.setAuthorizer(null);
      }
    },
    findUser(nameOrId) {
      const term = nameOrId.trim().toLowerCase();
      const row = db.prepare("SELECT user_id, name, role FROM users WHERE lower(user_id) = ? OR lower(name) = ?").get(term, term) as Row | undefined;
      return row && { userId: row.user_id, name: row.name, role: row.role };
    },
    recordKnowledge(input) {
      if (!db.prepare("SELECT 1 FROM users WHERE user_id = ?").get(input.authorUserId)) {
        throw new KnowledgeError(`No user with ID ${input.authorUserId}`);
      }
      if (input.kind === "correction") return recordCorrection(input);
      return input.kind === "rule_override" ? recordRuleOverride(input) : recordStatement(input);
    },
    wellSnapshot(assetId) {
      const row = db
        .prepare(
          `SELECT l.*, w.name AS well_name, w.well_type, w.lat, w.lon, a.name AS area_name,
                  r.document AS rule_document, r.section AS rule_section
           FROM latest_inspections l
           JOIN wells w ON w.asset_id = l.asset_id
           LEFT JOIN areas a ON a.area_id = w.area_id
           JOIN rules r ON r.well_type = w.well_type AND r.key = 'producing_threshold_c'
           WHERE l.asset_id = ?`,
        )
        .get(assetId) as Row | undefined;
      if (!row) return undefined;
      return {
        assetId: row.asset_id,
        name: row.well_name,
        wellType: row.well_type,
        areaName: row.area_name,
        location: row.lat === null ? null : { lat: row.lat, lon: row.lon },
        recordedStatus: row.recorded_status,
        statusMismatch: Boolean(row.status_mismatch),
        latestInspection: {
          inspectionId: row.inspection_id,
          inspectedAt: row.inspected_at,
          method: row.method,
          inspectorName: row.inspector_name,
          ambientTempC: row.ambient_temp_c,
          wellheadTempC: row.wellhead_temp_c,
          deltaC: row.delta_c,
          producing: Boolean(row.producing),
          notes: row.notes,
          disputed: Boolean(row.disputed),
          corrections: (
            db.prepare("SELECT * FROM corrections WHERE inspection_id = ? ORDER BY field").all(row.inspection_id) as Row[]
          ).map((c) => ({
            correctionId: c.correction_id,
            field: c.field,
            originalValue: c.original_value,
            correctedValue: c.corrected_value,
            authorName: c.author_name,
            reason: c.reason,
            createdAt: c.created_at,
            origin: c.origin,
          })),
        },
        producingRule: {
          thresholdC: row.producing_threshold_c,
          document: row.rule_document,
          section: row.rule_section,
        },
        openRepairs: (
          db
            .prepare("SELECT * FROM repairs WHERE asset_id = ? AND is_open ORDER BY started_at")
            .all(assetId) as Row[]
        ).map((r) => ({
          maintenanceId: r.maintenance_id,
          maintenanceType: r.maintenance_type,
          equipmentKind: r.equipment_kind,
          issue: r.issue,
          startedAt: r.started_at,
          plannedEnd: r.completed_at,
        })),
        validNotes: (
          db
            .prepare("SELECT * FROM notes WHERE asset_id = ? AND valid_at_as_of ORDER BY created_at")
            .all(assetId) as Row[]
        ).map((n) => ({
          noteId: n.note_id,
          kind: n.kind,
          noteType: n.note_type,
          status: n.status,
          origin: n.origin,
          authorName: n.author_name,
          createdAt: n.created_at,
          validFrom: n.valid_from,
          validTo: n.valid_to,
          inspectionId: n.inspection_id,
          text: n.text,
        })),
      };
    },
    report(maintenanceId) {
      const row = db.prepare("SELECT * FROM reports WHERE maintenance_id = ?").get(maintenanceId) as Row | undefined;
      if (!row) return undefined;
      const checks = db
        .prepare("SELECT protocol, result, detail FROM report_checks WHERE maintenance_id = ? ORDER BY position")
        .all(maintenanceId) as Row[];
      return {
        maintenanceId: row.maintenance_id,
        assetId: row.asset_id,
        reportFile: row.report_file,
        containmentHours: row.containment_hours,
        statedClass: row.stated_class,
        checks: checks.map((c) => ({ protocol: c.protocol, result: c.result, detail: c.detail })),
        text: row.text,
      };
    },
    searchReports(text, { assetId, limit = 10 } = {}) {
      const search = (match: string) =>
        db
          .prepare(
            `SELECT s.maintenance_id, s.asset_id, r.report_file,
                    snippet(report_search, 2, '[', ']', ' … ', 24) AS snippet
             FROM report_search s JOIN reports r ON r.maintenance_id = s.maintenance_id
             WHERE report_search MATCH ? AND (? IS NULL OR s.asset_id = ?)
             ORDER BY rank LIMIT ?`,
          )
          .all(match, assetId ?? null, assetId ?? null, limit) as Row[];
      let rows: Row[];
      try {
        rows = search(text);
      } catch {
        // Not valid FTS5 syntax: search the words as plain terms instead.
        const terms = text.match(/[\p{L}\p{N}§.-]+/gu) ?? [];
        rows = terms.length ? search(terms.map((t) => `"${t}"`).join(" ")) : [];
      }
      return rows.map((r) => ({
        maintenanceId: r.maintenance_id,
        assetId: r.asset_id,
        reportFile: r.report_file,
        snippet: r.snippet,
      }));
    },
    rules() {
      return (db.prepare("SELECT * FROM rules ORDER BY well_type, key").all() as Row[]).map((r) => ({
        wellType: r.well_type,
        key: r.key,
        value: r.value,
        unit: r.unit,
        document: r.document,
        section: r.section,
      }));
    },
    documents() {
      return (db.prepare("SELECT * FROM documents ORDER BY kind, path").all() as Row[]).map((d) => ({
        path: d.path,
        kind: d.kind,
        documentId: d.document_id,
        text: d.text,
      }));
    },
    close: () => db.close(),
  };
}
