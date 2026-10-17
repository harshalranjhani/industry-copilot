import { constants, DatabaseSync } from "node:sqlite";
import { openKnowledgeStore } from "./knowledge";
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
