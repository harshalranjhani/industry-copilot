import { DatabaseSync } from "node:sqlite";

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

export interface Fleet {
  /** The well's state at its latest inspection ("right now"), or undefined for an unknown well. */
  wellSnapshot(assetId: string): WellSnapshot | undefined;
  /** Every parsed rule, with the document and section that states it. */
  rules(): StoredRule[];
  /** Full text of every well-type manual and SOP. */
  documents(): StoredDocument[];
  close(): void;
}

type Row = Record<string, any>;

/** Opens the data store read-only; every answer goes through these views. */
export function openFleet(dbPath: string): Fleet {
  const db = new DatabaseSync(dbPath, { readOnly: true });

  return {
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
