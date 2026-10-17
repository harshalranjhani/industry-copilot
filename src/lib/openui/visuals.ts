/** Normalisers between the model's (possibly half-streamed) props and what the map and heatmap render. */

export interface MapPoint {
  lat: number;
  lon: number;
  label: string;
  detail?: string;
  value?: number;
}

const isNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

export function toMapPoints(raw: unknown): MapPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): MapPoint[] => {
    if (!item || typeof item !== "object") return [];
    const { lat, lon, label, detail, value } = item as Record<string, unknown>;
    if (!isNumber(lat) || !isNumber(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return [];
    if (typeof label !== "string" || label === "") return [];
    return [
      {
        lat,
        lon,
        label,
        ...(typeof detail === "string" && detail !== "" ? { detail } : {}),
        ...(isNumber(value) ? { value } : {}),
      },
    ];
  });
}

export interface HeatmapInput {
  rows?: unknown;
  columns?: unknown;
  values?: unknown;
  rowTotals?: unknown;
  columnTotals?: unknown;
}

export interface HeatmapData {
  /** Row-shaped data for OpenUI's HeatmapChart: `categoryKey` is the column label, every other key a row. */
  data: Record<string, string | number | undefined>[];
  categoryKey: string;
}

const CATEGORY_KEY = "__column";

const strings = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.map((s) => (s == null ? "" : String(s))) : [];

/**
 * Totals ride in the labels ("NE-08 · 35") rather than as extra cells, so they
 * don't stretch the colour scale. Returns null until there is a row and a column.
 */
export function toHeatmapData(input: HeatmapInput): HeatmapData | null {
  const rows = strings(input.rows);
  const columns = strings(input.columns);
  if (rows.length === 0 || columns.length === 0) return null;
  const values = Array.isArray(input.values) ? input.values : [];
  const withTotal = (labels: string[], totals: unknown) =>
    labels.map((label, i) => {
      const total = Array.isArray(totals) ? totals[i] : undefined;
      return isNumber(total) ? `${label} · ${total}` : label;
    });
  const rowKeys = withTotal(rows, input.rowTotals);
  const columnKeys = withTotal(columns, input.columnTotals);
  const data = columnKeys.map((columnKey, c) => {
    const datum: HeatmapData["data"][number] = { [CATEGORY_KEY]: columnKey };
    rowKeys.forEach((rowKey, r) => {
      const row = values[r];
      const cell = Array.isArray(row) ? row[c] : undefined;
      datum[rowKey] = isNumber(cell) ? cell : undefined;
    });
    return datum;
  });
  return { data, categoryKey: CATEGORY_KEY };
}
