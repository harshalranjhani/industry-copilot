/**
 * The data store's tables and the views every answer goes through. The store
 * is rebuilt from scratch on each load (ADR 0001), so there are no migrations.
 */
export const TABLES_SQL = `
CREATE TABLE teams (team_id TEXT PRIMARY KEY, name TEXT, lead_user_id TEXT);
CREATE TABLE areas (area_id TEXT PRIMARY KEY, name TEXT NOT NULL, team_id TEXT, center_lat REAL, center_lon REAL);
CREATE TABLE users (user_id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, team_id TEXT);

CREATE TABLE wells (
  asset_id TEXT PRIMARY KEY,
  name TEXT,
  well_type TEXT NOT NULL,
  area_id TEXT,
  team_id TEXT,
  in_charge_user_id TEXT,
  lat REAL,
  lon REAL,
  installed_on TEXT,
  recorded_status TEXT
);

CREATE TABLE inspections (
  inspection_id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  inspected_at TEXT NOT NULL,
  inspector_user_id TEXT,
  method TEXT,
  ambient_temp_c REAL,
  wellhead_temp_c REAL,
  spill_detected INTEGER,
  spill_area_pct REAL,
  spill_est_volume_bbl REAL,
  notes TEXT
);
CREATE INDEX inspections_by_well ON inspections (asset_id, inspected_at);

CREATE TABLE maintenance (
  maintenance_id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  maintenance_type TEXT,
  equipment_kind TEXT,
  issue TEXT,
  action_taken TEXT,
  technician_user_id TEXT,
  contractor TEXT,
  downtime_hours REAL,
  cost_labor_usd REAL,
  cost_parts_usd REAL,
  cost_total_usd REAL,
  triggered_by_inspection_id TEXT,
  report_file TEXT
);
CREATE INDEX maintenance_by_well ON maintenance (asset_id, started_at);

CREATE TABLE regulatory_events (
  event_id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  date TEXT NOT NULL,
  agency TEXT,
  event_type TEXT,
  protocol_id TEXT,
  related_inspection_id TEXT,
  hours_to_report REAL,
  detail TEXT,
  fine_usd REAL,
  status TEXT
);

CREATE TABLE rules (
  well_type TEXT NOT NULL,
  key TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  document TEXT NOT NULL,
  section TEXT NOT NULL,
  PRIMARY KEY (well_type, key)
);

CREATE TABLE documents (
  path TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  document_id TEXT NOT NULL,
  text TEXT NOT NULL
);
`;

/**
 * The fleet views, created as TEMP views each time the store is opened because
 * they apply the knowledge store (attached as `knowledge`) on top of the data
 * tables, and read `asOf` for open/closed repairs and valid notes.
 */
export function viewsSql(asOf: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error(`AS_OF must be a YYYY-MM-DD date, got "${asOf}"`);
  return `
-- Per inspection: the delta above ambient and whether the well was producing,
-- judged with its well type's threshold (never by absolute temperature), plus
-- the knowledge store's corrections: the original detection stays beside the
-- effective one.
CREATE TEMP VIEW effective_inspections AS
SELECT
  i.inspection_id,
  i.asset_id,
  w.well_type,
  w.area_id,
  a.name AS area_name,
  i.inspected_at,
  date(i.inspected_at) AS inspected_on,
  i.inspector_user_id,
  u.name AS inspector_name,
  i.method,
  i.ambient_temp_c,
  i.wellhead_temp_c,
  ROUND(i.wellhead_temp_c - i.ambient_temp_c, 1) AS delta_c,
  r.value AS producing_threshold_c,
  ROUND(i.wellhead_temp_c - i.ambient_temp_c, 1) >= r.value AS producing,
  i.spill_detected AS spill_detected_original,
  COALESCE(c.corrected_value, i.spill_detected) AS is_spill,
  c.entry_id AS correction_id,
  c.author_user_id AS corrected_by_user_id,
  i.spill_area_pct,
  i.spill_est_volume_bbl,
  CASE WHEN COALESCE(c.corrected_value, i.spill_detected) THEN i.spill_est_volume_bbl END AS spill_effective_volume_bbl,
  CASE
    WHEN NOT COALESCE(c.corrected_value, i.spill_detected) THEN NULL
    WHEN i.spill_est_volume_bbl >= b.major_min THEN 'major'
    WHEN i.spill_est_volume_bbl >= b.reportable_min THEN 'reportable'
    WHEN i.spill_est_volume_bbl >= b.moderate_min THEN 'moderate'
    ELSE 'minor'
  END AS spill_class,
  i.notes
FROM inspections i
JOIN wells w ON w.asset_id = i.asset_id
JOIN rules r ON r.well_type = w.well_type AND r.key = 'producing_threshold_c'
LEFT JOIN areas a ON a.area_id = w.area_id
LEFT JOIN users u ON u.user_id = i.inspector_user_id
CROSS JOIN (
  SELECT
    MAX(CASE WHEN key = 'spill_class_moderate_min_bbl' THEN value END) AS moderate_min,
    MAX(CASE WHEN key = 'spill_class_reportable_min_bbl' THEN value END) AS reportable_min,
    MAX(CASE WHEN key = 'spill_class_major_min_bbl' THEN value END) AS major_min
  FROM rules WHERE well_type = '*'
) b
LEFT JOIN (
  SELECT entry_id, inspection_id, author_user_id, CAST(value AS INTEGER) AS corrected_value,
         ROW_NUMBER() OVER (PARTITION BY inspection_id ORDER BY created_at DESC) AS recency
  FROM knowledge_entries
  WHERE kind = 'correction' AND scope = 'inspection_field' AND field = 'spill_detected' AND status = 'accepted'
) c ON c.inspection_id = i.inspection_id AND c.recency = 1;

-- "Right now" means each well's latest inspection. The recorded status is
-- refreshed monthly, so status_mismatch flags when it disagrees.
CREATE TEMP VIEW latest_inspections AS
SELECT
  e.*,
  w.name AS well_name,
  w.recorded_status,
  COALESCE(w.recorded_status = 'active', 0) <> e.producing AS status_mismatch
FROM effective_inspections e
JOIN wells w ON w.asset_id = e.asset_id
WHERE e.inspected_at = (SELECT MAX(inspected_at) FROM inspections WHERE asset_id = e.asset_id);

-- Downtime: 7 days for each inspection that finds the well not producing. A
-- missed inspection has no row, so it adds nothing. Filter by inspected_on for a period.
CREATE TEMP VIEW downtime AS
SELECT
  e.inspection_id,
  e.asset_id,
  e.well_type,
  e.area_id,
  e.area_name,
  e.inspected_at,
  e.inspected_on,
  e.delta_c,
  e.producing_threshold_c,
  7 AS downtime_days,
  e.inspector_name,
  e.notes
FROM effective_inspections e
WHERE NOT e.producing;

-- Repairs (maintenance jobs). A repair belongs to a period by its start date
-- (started_on). A repair is open while its planned end (completed_at) is after
-- AS_OF. downtime_hours is how long this one job took, never the well's downtime.
CREATE TEMP VIEW repairs AS
SELECT
  m.maintenance_id,
  m.asset_id,
  w.well_type,
  w.area_id,
  a.name AS area_name,
  m.maintenance_type,
  m.equipment_kind,
  m.started_at,
  date(m.started_at) AS started_on,
  m.completed_at,
  COALESCE(date(m.completed_at) > '${asOf}', 0) AS is_open,
  m.issue,
  m.action_taken,
  m.technician_user_id,
  u.name AS technician_name,
  m.contractor,
  m.downtime_hours AS job_hours,
  m.cost_labor_usd,
  m.cost_parts_usd,
  m.cost_total_usd AS cost_usd,
  m.triggered_by_inspection_id,
  m.report_file
FROM maintenance m
JOIN wells w ON w.asset_id = m.asset_id
LEFT JOIN areas a ON a.area_id = w.area_id
LEFT JOIN users u ON u.user_id = m.technician_user_id;

-- Human notes and corrections about a well, from the knowledge store. A note
-- is valid at a date d when valid_from <= d and (valid_to IS NULL OR valid_to >= d);
-- valid_at_as_of is that test for AS_OF.
CREATE TEMP VIEW notes AS
SELECT
  k.entry_id AS note_id,
  k.asset_id,
  a.name AS area_name,
  k.kind,
  k.note_type,
  k.status,
  k.origin,
  k.author_user_id,
  u.name AS author_name,
  k.created_at,
  k.valid_from,
  k.valid_to,
  (k.valid_from IS NULL OR k.valid_from <= '${asOf}') AND (k.valid_to IS NULL OR k.valid_to >= '${asOf}') AS valid_at_as_of,
  COALESCE(k.inspection_id, (SELECT MIN(l.inspection_id) FROM knowledge_inspection_links l WHERE l.entry_id = k.entry_id)) AS inspection_id,
  k.text
FROM knowledge_entries k
JOIN wells w ON w.asset_id = k.asset_id
LEFT JOIN areas a ON a.area_id = w.area_id
LEFT JOIN users u ON u.user_id = k.author_user_id;

-- Real spills only: detections a correction removed are left out.
CREATE TEMP VIEW spills AS
SELECT
  e.inspection_id,
  e.asset_id,
  e.well_type,
  e.area_id,
  e.area_name,
  e.inspected_at,
  e.inspected_on,
  substr(e.inspected_on, 1, 7) AS inspected_month,
  w.lat,
  w.lon,
  e.spill_area_pct,
  e.spill_est_volume_bbl,
  e.spill_effective_volume_bbl,
  e.spill_class,
  e.notes
FROM effective_inspections e
JOIN wells w ON w.asset_id = e.asset_id
WHERE e.is_spill;
`;
}

export interface ViewDoc {
  name: string;
  description: string;
  columns: { name: string; description: string }[];
}

const col = (name: string, description: string) => ({ name, description });

/** The views the `query` tool may read, with every column. A test keeps this in step with the SQL above. */
export const VIEW_DOCS: ViewDoc[] = [
  {
    name: "effective_inspections",
    description:
      "One row per weekly inspection, with knowledge applied. Producing is derived from the delta against the well type's threshold. Use it for readings over time. A missed inspection has no row.",
    columns: [
      col("inspection_id", "e.g. INS-0001-0203"),
      col("asset_id", "well ID"),
      col("well_type", "e.g. T200"),
      col("area_id", "area ID"),
      col("area_name", "area name, e.g. Northeast Block 8"),
      col("inspected_at", "ISO 8601 UTC timestamp (also the spill discovery time)"),
      col("inspected_on", "date of the inspection, YYYY-MM-DD; filter periods on this"),
      col("inspector_user_id", "inspector's user ID"),
      col("inspector_name", "inspector's name"),
      col("method", "drone or manual"),
      col("ambient_temp_c", "air temperature, °C"),
      col("wellhead_temp_c", "wellhead temperature, °C"),
      col("delta_c", "wellhead minus ambient, °C"),
      col("producing_threshold_c", "the well type's producing threshold, °C above ambient"),
      col("producing", "1 when delta_c >= producing_threshold_c, else 0"),
      col("spill_detected_original", "the detection as recorded in the dataset (1/0)"),
      col("is_spill", "1 when a spill still stands after corrections, else 0"),
      col("correction_id", "the correction note that overrode the detection, or NULL"),
      col("corrected_by_user_id", "who made that correction, or NULL"),
      col("spill_area_pct", "% of pad area, NULL when no detection"),
      col("spill_est_volume_bbl", "the AI's volume estimate for the detection, bbl"),
      col("spill_effective_volume_bbl", "volume of the real spill, bbl; NULL when is_spill = 0"),
      col("spill_class", "minor | moderate | reportable | major (Spill Response SOP bounds); NULL when is_spill = 0"),
      col("notes", "the inspector's remark"),
    ],
  },
  {
    name: "latest_inspections",
    description:
      'One row per well: its latest effective inspection. "Right now" means this row. Has every effective_inspections column plus the recorded status.',
    columns: [
      col("inspection_id", "as in effective_inspections"),
      col("asset_id", ""),
      col("well_type", ""),
      col("area_id", ""),
      col("area_name", ""),
      col("inspected_at", ""),
      col("inspected_on", ""),
      col("inspector_user_id", ""),
      col("inspector_name", ""),
      col("method", ""),
      col("ambient_temp_c", ""),
      col("wellhead_temp_c", ""),
      col("delta_c", ""),
      col("producing_threshold_c", ""),
      col("producing", ""),
      col("spill_detected_original", ""),
      col("is_spill", ""),
      col("correction_id", ""),
      col("corrected_by_user_id", ""),
      col("spill_area_pct", ""),
      col("spill_est_volume_bbl", ""),
      col("spill_effective_volume_bbl", ""),
      col("spill_class", ""),
      col("notes", ""),
      col("well_name", "display name"),
      col("recorded_status", "active or down in the system of record, refreshed monthly; can be out of date"),
      col("status_mismatch", "1 when the recorded status disagrees with the latest inspection"),
    ],
  },
  {
    name: "downtime",
    description:
      "One row per inspection that found the well not producing: 7 days of downtime each. Sum downtime_days over a period; never use repairs.job_hours for downtime. A missed inspection adds nothing.",
    columns: [
      col("inspection_id", ""),
      col("asset_id", ""),
      col("well_type", ""),
      col("area_id", ""),
      col("area_name", ""),
      col("inspected_at", ""),
      col("inspected_on", "filter periods on this"),
      col("delta_c", ""),
      col("producing_threshold_c", ""),
      col("downtime_days", "always 7"),
      col("inspector_name", ""),
      col("notes", "the inspector's remark, often the visible cause"),
    ],
  },
  {
    name: "spills",
    description:
      "Real spills only: detections that a correction removed (e.g. rainwater) are not here. Use it for every spill count, volume, map or heatmap.",
    columns: [
      col("inspection_id", ""),
      col("asset_id", ""),
      col("well_type", ""),
      col("area_id", ""),
      col("area_name", ""),
      col("inspected_at", ""),
      col("inspected_on", "filter periods on this"),
      col("inspected_month", "YYYY-MM"),
      col("lat", "well latitude"),
      col("lon", "well longitude"),
      col("spill_area_pct", ""),
      col("spill_est_volume_bbl", "the AI's estimate, bbl"),
      col("spill_effective_volume_bbl", "volume to report, bbl"),
      col("spill_class", "minor | moderate | reportable | major"),
      col("notes", "the inspector's remark"),
    ],
  },
  {
    name: "repairs",
    description:
      "One row per repair (maintenance job), scheduled or corrective. A repair belongs to a period by started_on. A repair is open while its planned end is after AS_OF.",
    columns: [
      col("maintenance_id", "e.g. MNT-0170-031"),
      col("asset_id", ""),
      col("well_type", ""),
      col("area_id", ""),
      col("area_name", ""),
      col("maintenance_type", "scheduled or corrective"),
      col("equipment_kind", "wellhead, pump_jack, rod_string, downhole_pump, flowline or separator"),
      col("started_at", ""),
      col("started_on", "date the repair started, YYYY-MM-DD; filter periods on this"),
      col("completed_at", "completion time; the planned end while the repair is open"),
      col("is_open", "1 when the planned end is after AS_OF"),
      col("issue", "what was wrong"),
      col("action_taken", "what was done"),
      col("technician_user_id", ""),
      col("technician_name", ""),
      col("contractor", ""),
      col("job_hours", "how long this one job took; NOT well downtime"),
      col("cost_labor_usd", ""),
      col("cost_parts_usd", ""),
      col("cost_usd", "total cost; sum this for spend"),
      col("triggered_by_inspection_id", "the inspection that led to the job, or NULL"),
      col("report_file", "path of the repair report, or NULL"),
    ],
  },
  {
    name: "notes",
    description:
      "Human notes and corrections about a well. A note is valid at date d when valid_from <= d AND (valid_to IS NULL OR valid_to >= d); valid_at_as_of applies that test to AS_OF. Notes are reasons a well stopped.",
    columns: [
      col("note_id", "e.g. CTX-0001-003"),
      col("asset_id", ""),
      col("area_name", ""),
      col("kind", "note | correction | claim"),
      col("note_type", "operator_feedback, operator_note or correction (the dataset's label)"),
      col("status", "accepted | unconfirmed | disputed"),
      col("origin", "dataset or chat"),
      col("author_user_id", ""),
      col("author_name", ""),
      col("created_at", ""),
      col("valid_from", "YYYY-MM-DD"),
      col("valid_to", "YYYY-MM-DD or NULL when open-ended"),
      col("valid_at_as_of", "1 when valid at AS_OF"),
      col("inspection_id", "the inspection the note is about (named in a correction, or in the note's text), or NULL"),
      col("text", "the note itself"),
    ],
  },
];
