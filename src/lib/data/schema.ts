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

export const VIEWS_SQL = `
-- Per inspection: the delta above ambient and whether the well was producing,
-- judged with its well type's threshold (never by absolute temperature).
CREATE VIEW effective_inspections AS
SELECT
  i.inspection_id,
  i.asset_id,
  i.inspected_at,
  i.inspector_user_id,
  u.name AS inspector_name,
  i.method,
  i.ambient_temp_c,
  i.wellhead_temp_c,
  ROUND(i.wellhead_temp_c - i.ambient_temp_c, 1) AS delta_c,
  r.value AS producing_threshold_c,
  ROUND(i.wellhead_temp_c - i.ambient_temp_c, 1) >= r.value AS producing,
  i.spill_detected,
  i.spill_area_pct,
  i.spill_est_volume_bbl,
  i.notes
FROM inspections i
JOIN wells w ON w.asset_id = i.asset_id
JOIN rules r ON r.well_type = w.well_type AND r.key = 'producing_threshold_c'
LEFT JOIN users u ON u.user_id = i.inspector_user_id;

-- "Right now" means each well's latest inspection. The recorded status is
-- refreshed monthly, so status_mismatch flags when it disagrees.
CREATE VIEW latest_inspections AS
SELECT
  e.*,
  w.recorded_status,
  COALESCE(w.recorded_status = 'active', 0) <> e.producing AS status_mismatch
FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY asset_id ORDER BY inspected_at DESC) AS recency
  FROM effective_inspections
) e
JOIN wells w ON w.asset_id = e.asset_id
WHERE e.recency = 1;
`;
