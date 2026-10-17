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

-- Repair reports, found only through maintenance.report_file, with the facts
-- that exist only in their free text.
CREATE TABLE reports (
  maintenance_id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  report_file TEXT NOT NULL,
  containment_hours REAL,
  stated_class TEXT,
  text TEXT NOT NULL
);
CREATE TABLE report_checks (
  maintenance_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  protocol TEXT NOT NULL,
  result TEXT NOT NULL,
  detail TEXT,
  PRIMARY KEY (maintenance_id, position)
);
-- Filled from reports once every root is loaded.
CREATE VIRTUAL TABLE report_search USING fts5(maintenance_id UNINDEXED, asset_id UNINDEXED, text);

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
-- The corrections in force: per inspection and field, the latest accepted
-- correction (a chat one wins over a dataset one). The original value is kept
-- beside the corrected one, with who made it and why.
CREATE TEMP VIEW corrections AS
SELECT
  k.entry_id AS correction_id,
  k.inspection_id,
  k.asset_id,
  k.field,
  k.original_value,
  k.value AS corrected_value,
  k.reason,
  k.author_user_id,
  u.name AS author_name,
  k.created_at,
  k.origin
FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY inspection_id, field ORDER BY origin = 'chat' DESC, created_at DESC) AS recency
  FROM knowledge_entries
  WHERE kind = 'correction' AND scope = 'inspection_field' AND status = 'accepted'
) k
LEFT JOIN users u ON u.user_id = k.author_user_id
WHERE k.recency = 1;

-- Inspections that two or more people have written (non-correction) notes
-- about: the notes disagree, and neither is a formal correction. The detection
-- stands unless a correction removes it.
CREATE TEMP VIEW disputes AS
SELECT
  l.inspection_id,
  i.asset_id,
  COUNT(*) AS note_count,
  group_concat(k.entry_id, ', ' ORDER BY k.created_at, k.entry_id) AS note_ids,
  group_concat(u.name, ', ' ORDER BY k.created_at, k.entry_id) AS authors
FROM knowledge_inspection_links l
JOIN knowledge_entries k ON k.entry_id = l.entry_id AND k.kind = 'note'
JOIN inspections i ON i.inspection_id = l.inspection_id
LEFT JOIN users u ON u.user_id = k.author_user_id
GROUP BY l.inspection_id
HAVING COUNT(DISTINCT k.author_user_id) >= 2;

-- Per inspection: the delta above ambient and whether the well was producing,
-- judged with its well type's threshold (never by absolute temperature), plus
-- the knowledge store's corrections: the original reading stays beside the
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
  i.ambient_eff AS ambient_temp_c,
  i.ambient_temp_c AS ambient_temp_c_original,
  i.wellhead_eff AS wellhead_temp_c,
  i.wellhead_temp_c AS wellhead_temp_c_original,
  ROUND(i.wellhead_eff - i.ambient_eff, 1) AS delta_c,
  r.value AS producing_threshold_c,
  ROUND(i.wellhead_eff - i.ambient_eff, 1) >= r.value AS producing,
  i.spill_detected AS spill_detected_original,
  i.spill_eff AS is_spill,
  ca.correction_id,
  ca.author_user_id AS corrected_by_user_id,
  ca.author_name AS corrected_by_name,
  ca.fields AS corrected_fields,
  i.inspection_id IN (SELECT inspection_id FROM disputes) AS disputed,
  i.spill_area_pct,
  i.spill_est_volume_bbl,
  CASE WHEN i.spill_eff THEN i.volume_eff END AS spill_effective_volume_bbl,
  CASE
    WHEN NOT i.spill_eff THEN NULL
    WHEN i.volume_eff >= b.major_min THEN 'major'
    WHEN i.volume_eff >= b.reportable_min THEN 'reportable'
    WHEN i.volume_eff >= b.moderate_min THEN 'moderate'
    ELSE 'minor'
  END AS spill_class,
  i.notes
FROM (
  SELECT
    n.*,
    COALESCE(cw.corrected_value, n.wellhead_temp_c) AS wellhead_eff,
    COALESCE(cm.corrected_value, n.ambient_temp_c) AS ambient_eff,
    COALESCE(cs.corrected_value, n.spill_detected) AS spill_eff,
    COALESCE(cv.corrected_value, n.spill_est_volume_bbl) AS volume_eff
  FROM inspections n
  LEFT JOIN corrections cw ON cw.inspection_id = n.inspection_id AND cw.field = 'wellhead_temp_c'
  LEFT JOIN corrections cm ON cm.inspection_id = n.inspection_id AND cm.field = 'ambient_temp_c'
  LEFT JOIN corrections cs ON cs.inspection_id = n.inspection_id AND cs.field = 'spill_detected'
  LEFT JOIN corrections cv ON cv.inspection_id = n.inspection_id AND cv.field = 'spill_est_volume_bbl'
) i
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
  -- The latest correction on the inspection (bare columns come from the MAX row) and every field corrected.
  SELECT inspection_id, correction_id, author_user_id, author_name, MAX(created_at) AS latest_at,
         group_concat(field, ', ') AS fields
  FROM corrections GROUP BY inspection_id
) ca ON ca.inspection_id = i.inspection_id;

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
  CASE
    WHEN k.kind = 'note' AND k.entry_id IN (
      SELECT l.entry_id FROM knowledge_inspection_links l WHERE l.inspection_id IN (SELECT inspection_id FROM disputes)
    ) THEN 'disputed'
    ELSE k.status
  END AS status,
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

-- Regulator events. A notice of violation must be answered within the RC-04
-- window (from the notice date) by a nov_response_filed event for the same spill.
CREATE TEMP VIEW regulator_events AS
SELECT
  e.event_id,
  e.asset_id,
  w.well_type,
  w.area_id,
  a.name AS area_name,
  e.date,
  e.agency,
  e.event_type,
  e.protocol_id,
  e.related_inspection_id,
  e.hours_to_report,
  e.detail,
  e.fine_usd,
  e.status,
  CASE WHEN e.event_type = 'notice_of_violation' THEN date(e.date, '+' || rc04.value || ' days') END AS response_due_on,
  resp.event_id AS response_event_id,
  CASE
    WHEN e.event_type <> 'notice_of_violation' THEN NULL
    WHEN resp.event_id IS NOT NULL AND resp.date <= date(e.date, '+' || rc04.value || ' days') THEN 'met'
    WHEN resp.event_id IS NOT NULL THEN 'breached_late'
    WHEN date(e.date, '+' || rc04.value || ' days') < '${asOf}' THEN 'breached_open'
    ELSE 'pending'
  END AS rc04_status
FROM main.regulatory_events e
JOIN wells w ON w.asset_id = e.asset_id
LEFT JOIN areas a ON a.area_id = w.area_id
JOIN rules rc04 ON rc04.well_type = '*' AND rc04.key = 'rc04_response_days'
LEFT JOIN main.regulatory_events resp ON resp.event_id = (
  SELECT r.event_id FROM main.regulatory_events r
  WHERE e.event_type = 'notice_of_violation' AND r.event_type = 'nov_response_filed'
    AND r.asset_id = e.asset_id AND r.related_inspection_id IS e.related_inspection_id AND r.date >= e.date
  ORDER BY r.date LIMIT 1
);

-- Per well and equipment kind: corrective repairs started in the RCA window
-- (the well type's rca_window_months before AS_OF, both ends inclusive)
-- against the effective escalation count. rule_source says which rule applied.
CREATE TEMP VIEW rca_candidates AS
SELECT
  w.asset_id,
  w.well_type,
  w.area_id,
  a.name AS area_name,
  m.equipment_kind,
  COUNT(*) AS corrective_repairs,
  group_concat(m.maintenance_id, ', ' ORDER BY m.started_at) AS repair_ids,
  date('${asOf}', '-' || win.value || ' months') AS window_start,
  win.value AS window_months,
  cnt.value AS rca_threshold,
  'manual' AS rule_source,
  cnt.document AS rule_document,
  cnt.section AS rule_section,
  COUNT(*) >= cnt.value AS needs_rca
FROM maintenance m
JOIN wells w ON w.asset_id = m.asset_id
LEFT JOIN areas a ON a.area_id = w.area_id
JOIN rules cnt ON cnt.well_type = w.well_type AND cnt.key = 'rca_corrective_count'
JOIN rules win ON win.well_type = w.well_type AND win.key = 'rca_window_months'
WHERE m.maintenance_type = 'corrective'
  AND date(m.started_at) >= date('${asOf}', '-' || win.value || ' months')
  AND date(m.started_at) <= '${asOf}'
GROUP BY w.asset_id, m.equipment_kind;

-- Per real spill, its Spill Response SOP duties. Discovery is the inspection
-- time. SR-01 (written notice) and SR-03 (agency verification) apply to the
-- effective class (reportable or major); SR-02 (containment) to every spill and
-- its hours exist only in the repair report. A deadline after AS_OF is pending.
CREATE TEMP VIEW spill_compliance AS
WITH r AS (
  SELECT
    MAX(CASE WHEN key = 'sr01_notice_hours' THEN value END) AS notice_hours,
    MAX(CASE WHEN key = 'sr01_major_notice_hours' THEN value END) AS major_notice_hours,
    MAX(CASE WHEN key = 'sr02_containment_hours' THEN value END) AS containment_limit,
    MAX(CASE WHEN key = 'sr03_verification_days' THEN value END) AS verification_days
  FROM rules WHERE well_type = '*'
),
base AS (
  SELECT
    s.*,
    s.spill_class IN ('reportable', 'major') AS reporting_required,
    CASE WHEN s.spill_class = 'major' THEN r.major_notice_hours WHEN s.spill_class = 'reportable' THEN r.notice_hours END AS report_deadline_hours,
    r.containment_limit,
    r.verification_days,
    (SELECT e.event_id FROM regulatory_events e
     WHERE e.related_inspection_id = s.inspection_id AND e.event_type = 'spill_report_filed'
     ORDER BY e.date LIMIT 1) AS report_event_id,
    (SELECT m.maintenance_id FROM maintenance m JOIN reports rp ON rp.maintenance_id = m.maintenance_id
     WHERE m.triggered_by_inspection_id = s.inspection_id
     ORDER BY rp.containment_hours IS NULL, m.started_at LIMIT 1) AS repair_id,
    (SELECT e.event_id FROM regulatory_events e
     WHERE e.related_inspection_id = s.inspection_id AND e.event_type = 'site_inspection' AND e.protocol_id = 'SR-03'
     ORDER BY e.status = 'closed' DESC, e.date DESC LIMIT 1) AS sr03_event_id
  FROM spills s CROSS JOIN r
)
SELECT
  b.inspection_id,
  b.asset_id,
  b.well_type,
  b.area_id,
  b.area_name,
  b.inspected_at AS discovered_at,
  b.inspected_on AS discovered_on,
  b.spill_effective_volume_bbl,
  b.spill_class,
  b.reporting_required,
  b.report_deadline_hours,
  CASE WHEN b.reporting_required THEN strftime('%Y-%m-%dT%H:%M:%SZ', b.inspected_at, '+' || b.report_deadline_hours || ' hours') END AS report_due_at,
  b.report_event_id,
  f.date AS report_filed_on,
  f.hours_to_report,
  CASE
    WHEN NOT b.reporting_required THEN 'not_required'
    WHEN f.event_id IS NOT NULL AND f.hours_to_report IS NULL THEN 'unknown'
    WHEN f.event_id IS NOT NULL AND f.hours_to_report > b.report_deadline_hours THEN 'breached_late'
    WHEN f.event_id IS NOT NULL THEN 'met'
    WHEN strftime('%Y-%m-%dT%H:%M:%SZ', b.inspected_at, '+' || b.report_deadline_hours || ' hours') < '${asOf}' THEN 'breached_open'
    ELSE 'pending'
  END AS sr01_status,
  b.repair_id,
  rp.report_file,
  rp.containment_hours,
  b.containment_limit AS containment_limit_hours,
  CASE
    WHEN rp.containment_hours IS NULL THEN 'unknown'
    WHEN rp.containment_hours > b.containment_limit THEN 'breached_late'
    ELSE 'met'
  END AS sr02_status,
  b.reporting_required AS sr03_required,
  CASE WHEN b.reporting_required THEN date(b.inspected_on, '+' || b.verification_days || ' days') END AS sr03_due_on,
  b.sr03_event_id,
  v.status AS sr03_event_status,
  CASE
    WHEN NOT b.reporting_required THEN 'not_required'
    WHEN v.status = 'closed' AND v.date <= date(b.inspected_on, '+' || b.verification_days || ' days') THEN 'met'
    WHEN v.status = 'closed' THEN 'breached_late'
    WHEN date(b.inspected_on, '+' || b.verification_days || ' days') < '${asOf}' THEN 'breached_open'
    ELSE 'pending'
  END AS sr03_status,
  rp.stated_class AS report_stated_class,
  COALESCE(rp.stated_class <> b.spill_class, 0) AS class_mismatch
FROM base b
LEFT JOIN regulatory_events f ON f.event_id = b.report_event_id
LEFT JOIN reports rp ON rp.maintenance_id = b.repair_id
LEFT JOIN regulatory_events v ON v.event_id = b.sr03_event_id;
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
      col("ambient_temp_c", "air temperature, °C, after corrections"),
      col("ambient_temp_c_original", "the air temperature as recorded in the dataset"),
      col("wellhead_temp_c", "wellhead temperature, °C, after corrections"),
      col("wellhead_temp_c_original", "the wellhead temperature as recorded in the dataset"),
      col("delta_c", "wellhead minus ambient, °C, after corrections"),
      col("producing_threshold_c", "the well type's producing threshold, °C above ambient"),
      col("producing", "1 when delta_c >= producing_threshold_c, else 0"),
      col("spill_detected_original", "the detection as recorded in the dataset (1/0)"),
      col("is_spill", "1 when a spill still stands after corrections, else 0"),
      col("correction_id", "the latest correction applied to this inspection (any field), or NULL"),
      col("corrected_by_user_id", "who made it, or NULL"),
      col("corrected_by_name", "their name, or NULL"),
      col("corrected_fields", "every field corrected on this inspection, comma-separated, or NULL; see corrections"),
      col("disputed", "1 when people's notes about this inspection disagree (see disputes); the detection still stands unless corrected"),
      col("spill_area_pct", "% of pad area, NULL when no detection"),
      col("spill_est_volume_bbl", "the AI's volume estimate for the detection, bbl (never overwritten)"),
      col("spill_effective_volume_bbl", "volume of the real spill after a measured correction, bbl; NULL when is_spill = 0"),
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
      col("ambient_temp_c_original", ""),
      col("wellhead_temp_c", ""),
      col("wellhead_temp_c_original", ""),
      col("delta_c", ""),
      col("producing_threshold_c", ""),
      col("producing", ""),
      col("spill_detected_original", ""),
      col("is_spill", ""),
      col("correction_id", ""),
      col("corrected_by_user_id", ""),
      col("corrected_by_name", ""),
      col("corrected_fields", ""),
      col("disputed", ""),
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
    name: "corrections",
    description:
      "The corrections in force: one row per corrected inspection field, with the original value beside the corrected one, who made it and why. A correction applies to everyone, so say \"corrected by <name>\" wherever one changed an answer. Fields: wellhead_temp_c, ambient_temp_c, spill_detected, spill_est_volume_bbl.",
    columns: [
      col("correction_id", "the knowledge entry's ID"),
      col("inspection_id", "the inspection corrected"),
      col("asset_id", "well ID"),
      col("field", "wellhead_temp_c | ambient_temp_c | spill_detected | spill_est_volume_bbl"),
      col("original_value", "the value in the dataset (for spill_detected: 1)"),
      col("corrected_value", "the value now used (for spill_detected: 0 means not a spill)"),
      col("reason", "why it was corrected, or NULL for a dataset note"),
      col("author_user_id", ""),
      col("author_name", "who made the correction"),
      col("created_at", ""),
      col("origin", "dataset or chat"),
    ],
  },
  {
    name: "disputes",
    description:
      "Inspections that people's notes disagree about (two or more authors, none of them a formal correction). Show both sides from notes (status = 'disputed') and say neither is a correction: the detection stands, the inspection still counts as a spill unless a correction removed it.",
    columns: [
      col("inspection_id", "the disputed inspection"),
      col("asset_id", "well ID"),
      col("note_count", "how many notes are about it"),
      col("note_ids", "their IDs, oldest first, comma-separated"),
      col("authors", "their authors' names, in the same order"),
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
    name: "rca_candidates",
    description:
      "One row per well and equipment kind with corrective repairs in the manual's RCA window (window_months, ending AS_OF). needs_rca = 1 when the count reaches the escalation count, which means a root-cause analysis is due before the next repair is closed. An RCA that is due is an open action, not a breach. Cite the repairs in repair_ids and the rule's document and section.",
    columns: [
      col("asset_id", ""),
      col("well_type", ""),
      col("area_id", ""),
      col("area_name", ""),
      col("equipment_kind", "wellhead, pump_jack, rod_string, downhole_pump, flowline or separator"),
      col("corrective_repairs", "corrective repairs started in the window"),
      col("repair_ids", "those repairs' maintenance IDs, oldest first, comma-separated"),
      col("window_start", "first date of the window, YYYY-MM-DD"),
      col("window_months", ""),
      col("rca_threshold", "the effective escalation count"),
      col("rule_source", "manual: the well-type manual's rule applied"),
      col("rule_document", "the document that states the rule, e.g. OM-T200"),
      col("rule_section", "its section"),
      col("needs_rca", "1 when corrective_repairs >= rca_threshold"),
    ],
  },
  {
    name: "regulator_events",
    description:
      "One row per regulator event: spill_report_filed (SR-01 written notice), notice_of_violation (with its fine), site_inspection (SR-03 verification: closed means it passed) and nov_response_filed (RC-04). A notice of violation must be answered within the RC-04 window; rc04_status tracks it. Status open means the agency has not closed it; open fines are SUM(fine_usd) WHERE status = 'open'.",
    columns: [
      col("event_id", "e.g. REG-0001-002"),
      col("asset_id", ""),
      col("well_type", ""),
      col("area_id", ""),
      col("area_name", ""),
      col("date", "YYYY-MM-DD"),
      col("agency", "State Oil & Gas Commission or Regional Environmental Protection Office"),
      col("event_type", "spill_report_filed | notice_of_violation | site_inspection | nov_response_filed"),
      col("protocol_id", "the SOP protocol the event is about, e.g. SR-01"),
      col("related_inspection_id", "the inspection that discovered the spill"),
      col("hours_to_report", "hours from discovery to the written notice"),
      col("detail", ""),
      col("fine_usd", ""),
      col("status", "open | closed"),
      col("response_due_on", "notice of violation only: RC-04 response deadline, YYYY-MM-DD"),
      col("response_event_id", "notice of violation only: the nov_response_filed event, or NULL when none is recorded"),
      col("rc04_status", "notice of violation only: met | breached_late (answered after the due date) | breached_open (due date passed, no response recorded) | pending"),
    ],
  },
  {
    name: "spill_compliance",
    description:
      "One row per real spill with its Spill Response SOP duties (SR-01 written notice, SR-02 containment, SR-03 agency verification), judged on the effective class. Containment hours come only from the repair report. Statuses: met | breached_late (done after the deadline) | breached_open (deadline before AS_OF and still not done: a breach that is also still open) | pending (deadline not yet passed: an open action, not a breach) | not_required | unknown (no report states it). Every status starting with breached is a breach. Cite the inspection, the regulator events, the repair report and the SOP protocol.",
    columns: [
      col("inspection_id", "the inspection that discovered the spill"),
      col("asset_id", ""),
      col("well_type", ""),
      col("area_id", ""),
      col("area_name", ""),
      col("discovered_at", "discovery time = inspection time, ISO 8601 UTC"),
      col("discovered_on", "discovery date, YYYY-MM-DD; filter periods on this"),
      col("spill_effective_volume_bbl", "volume after corrections, bbl"),
      col("spill_class", "effective class: minor | moderate | reportable | major"),
      col("reporting_required", "1 when the effective class is reportable or major (SR-01)"),
      col("report_deadline_hours", "SR-01 written-notice deadline from discovery (shorter for a major spill); NULL when not required"),
      col("report_due_at", "when the written notice was due, ISO 8601 UTC"),
      col("report_event_id", "the spill_report_filed regulator event, or NULL when none is recorded"),
      col("report_filed_on", "date the written notice was filed"),
      col("hours_to_report", "hours from discovery to the written notice"),
      col("sr01_status", "met | breached_late | breached_open | pending | not_required | unknown (filed, hours not recorded)"),
      col("repair_id", "the repair whose report covers the spill (maintenance_id)"),
      col("report_file", "that repair's report file"),
      col("containment_hours", "hours from discovery to containment, from the report; NULL when no report states it"),
      col("containment_limit_hours", "the SR-02 limit, hours"),
      col("sr02_status", "met | breached_late | unknown"),
      col("sr03_required", "1 when agency verification of the cleanup is required (reportable or major)"),
      col("sr03_due_on", "verification due date (discovery + the SR-03 window), YYYY-MM-DD"),
      col("sr03_event_id", "the SR-03 site_inspection regulator event, or NULL"),
      col("sr03_event_status", "open (verification still pending) or closed (passed)"),
      col("sr03_status", "met (verified in time) | breached_late (verified after the due date) | breached_open | pending | not_required"),
      col("report_stated_class", "the class the repair report states, or NULL"),
      col("class_mismatch", "1 when the report's stated class differs from the effective class (e.g. after a volume correction); the report's reporting statements then no longer hold"),
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
      col("report_file", "path of the repair report, or NULL; read it with read_report by maintenance_id"),
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
      col("status", "accepted | unconfirmed (a claim the data contradicts) | disputed (the note is one side of a dispute about an inspection)"),
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
