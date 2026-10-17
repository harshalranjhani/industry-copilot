import { constants, DatabaseSync } from "node:sqlite";
import { openKnowledgeStore } from "./knowledge";
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
  /** Every parsed rule, with the document and section that states it. */
  rules(): StoredRule[];
  /** Full text of every well-type manual and SOP. */
  documents(): StoredDocument[];
  close(): void;
}

type Row = Record<string, any>;

const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;

/** Opens the data store read-only; every answer goes through these views. */
export function openFleet(dbPath: string, { knowledgePath, asOf }: FleetOptions): Fleet {
  openKnowledgeStore(knowledgePath).close(); // the read-only attach below needs the file to exist
  const db = new DatabaseSync(dbPath, { readOnly: true });
  db.exec(`ATTACH DATABASE ${sqlString(`file:${knowledgePath}?mode=ro`)} AS knowledge`);
  db.exec(viewsSql(asOf));

  return {
    query(sql, { maxRows = DEFAULT_MAX_ROWS } = {}) {
      let denied: string | undefined;
      db.setAuthorizer((action, arg1, _arg2, _database, insideView) => {
        if (action === constants.SQLITE_SELECT || action === constants.SQLITE_FUNCTION || action === constants.SQLITE_RECURSIVE) {
          return constants.SQLITE_OK;
        }
        // Reading is fine inside a view's own definition; a query may only name the views.
        if (action === constants.SQLITE_READ) {
          if (insideView || VIEW_NAMES.has(String(arg1))) return constants.SQLITE_OK;
          denied = `table "${arg1}"`;
        } else {
          denied ??= "a statement that is not a plain SELECT";
        }
        return constants.SQLITE_DENY;
      });
      try {
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
