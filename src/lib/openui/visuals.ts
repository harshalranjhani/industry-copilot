/** Normalisers between the model's (possibly half-streamed) props and what the map, heatmap and plot render. */

export interface MapPoint {
  lat: number;
  lon: number;
  label: string;
  detail?: string;
  value?: number;
  /** A CSS colour for this pin; wins over the group and value colouring. */
  color?: string;
  /** A category shown in the legend, e.g. "Not producing". Pins of one group share a colour. */
  group?: string;
  /** Pin radius in pixels. */
  size?: number;
}

const isNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

const nonEmpty = (s: unknown): s is string => typeof s === "string" && s.trim() !== "";

// Hex, rgb()/hsl() or a plain colour name. Anything else (url(), expressions) is dropped.
const COLOR = /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla)\([\d\s.,%]+\)|[a-z]{3,20})$/i;
export const toColor = (raw: unknown): string | undefined =>
  typeof raw === "string" && COLOR.test(raw.trim()) ? raw.trim() : undefined;

export function toMapPoints(raw: unknown): MapPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): MapPoint[] => {
    if (!item || typeof item !== "object") return [];
    const { lat, lon, label, detail, value, color, group, size } = item as Record<string, unknown>;
    if (!isNumber(lat) || !isNumber(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return [];
    if (typeof label !== "string" || label === "") return [];
    const pinColor = toColor(color);
    return [
      {
        lat,
        lon,
        label,
        ...(nonEmpty(detail) ? { detail } : {}),
        ...(isNumber(value) ? { value } : {}),
        ...(pinColor ? { color: pinColor } : {}),
        ...(nonEmpty(group) ? { group } : {}),
        ...(isNumber(size) && size >= 2 && size <= 40 ? { size } : {}),
      },
    ];
  });
}

export const BASEMAPS = ["streets", "light", "dark", "satellite", "topo"] as const;
export type Basemap = (typeof BASEMAPS)[number];

export interface MapOptions {
  /** Unset means the app's default street map, which follows the light or dark theme. */
  basemap?: Basemap;
  /** Colour pins by their group (a legend entry per group) or along a ramp by their value. */
  colorBy?: "group" | "value";
  /** Group colours in order, or the low → high ramp for value colouring. */
  palette?: string[];
  legendTitle?: string;
  /** Keep every pin's label visible, not only in its popup. */
  showLabels?: boolean;
  /** Draw a line through the pins in order, e.g. an inspection route. */
  connect?: boolean;
}

export function toMapOptions(raw: unknown): MapOptions {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const palette = Array.isArray(o.palette) ? o.palette.map(toColor).filter((c): c is string => !!c) : [];
  return {
    ...(BASEMAPS.includes(o.basemap as Basemap) ? { basemap: o.basemap as Basemap } : {}),
    ...(o.colorBy === "group" || o.colorBy === "value" ? { colorBy: o.colorBy } : {}),
    ...(palette.length ? { palette } : {}),
    ...(nonEmpty(o.legendTitle) ? { legendTitle: o.legendTitle } : {}),
    ...(o.showLabels === true ? { showLabels: true } : {}),
    ...(o.connect === true ? { connect: true } : {}),
  };
}

/** Group colours when the model gives none: distinct in light and dark themes. */
export const DEFAULT_GROUP_PALETTE = ["#2a9d8f", "#e76f51", "#457b9d", "#e9c46a", "#8e6cc9", "#6a994e", "#d1495b", "#00a6d6"];
const DEFAULT_RAMP = ["#fde725", "#21918c", "#440154"];

function hexToRgb(hex: string): [number, number, number] | undefined {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(full)) return undefined;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

/** A colour at t (0..1) along a ramp of hex colours; a ramp with a non-hex stop falls back to its nearest stop. */
export function rampColor(ramp: string[], t: number): string {
  if (ramp.length === 1) return ramp[0]!;
  const x = Math.min(1, Math.max(0, t)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  const [a, b] = [hexToRgb(ramp[i]!), hexToRgb(ramp[i + 1]!)];
  if (!a || !b) return ramp[Math.round(x)]!;
  const f = x - i;
  return `#${a.map((v, k) => Math.round(v + (b[k]! - v) * f).toString(16).padStart(2, "0")).join("")}`;
}

export interface PinStyle {
  /** Undefined: the theme's default pin colour. */
  color?: string;
  radius: number;
}

export interface MapLegend {
  title?: string;
  /** Group legend: one swatch per group. */
  items?: { label: string; color: string }[];
  /** Value legend: the ramp and the values at its ends. */
  ramp?: { colors: string[]; min: number; max: number };
}

/** Each pin's colour and size, and the legend that explains the colours. */
export function styleMapPins(points: MapPoint[], options: MapOptions): { pins: PinStyle[]; legend?: MapLegend } {
  const radius = (p: MapPoint) => p.size ?? 8;
  const values = points.map((p) => p.value).filter(isNumber);
  const byValue = options.colorBy === "value" && values.length > 0;
  const groups = [...new Set(points.map((p) => p.group).filter(nonEmpty))];
  const byGroup = !byValue && groups.length > 0;

  if (byValue) {
    const ramp = options.palette && options.palette.length >= 2 ? options.palette : DEFAULT_RAMP;
    const [min, max] = [Math.min(...values), Math.max(...values)];
    const pins = points.map((p) => ({
      radius: radius(p),
      color: p.color ?? (isNumber(p.value) ? rampColor(ramp, max === min ? 1 : (p.value - min) / (max - min)) : undefined),
    }));
    return { pins, legend: { title: options.legendTitle, ramp: { colors: ramp, min, max } } };
  }
  if (byGroup) {
    const palette = options.palette ?? DEFAULT_GROUP_PALETTE;
    // A group whose pins all carry the same explicit colour uses it in the legend too.
    const items = groups.map((label, i) => {
      const explicit = [...new Set(points.filter((p) => p.group === label).map((p) => p.color))];
      const color = explicit.length === 1 && explicit[0] ? explicit[0] : palette[i % palette.length]!;
      return { label, color };
    });
    const colorOf = new Map(items.map((item) => [item.label, item.color]));
    const pins = points.map((p) => ({ radius: radius(p), color: p.color ?? (p.group ? colorOf.get(p.group) : undefined) }));
    return { pins, legend: { title: options.legendTitle, items } };
  }
  return { pins: points.map((p) => ({ radius: radius(p), color: p.color })) };
}

export interface HeatmapInput {
  rows?: unknown;
  columns?: unknown;
  values?: unknown;
  rowTotals?: unknown;
  columnTotals?: unknown;
}

/** The heatmap's low → high colours as given: one colour (a ramp up to it) or more. */
export function toPalette(raw: unknown): string[] | undefined {
  const colors = (Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : []).map(toColor).filter((c): c is string => !!c);
  return colors.length ? colors : undefined;
}

export const HEATMAP_STEPS = 9;

/**
 * A smooth low → high ramp of `steps` hex colours through the given hex stops.
 * The heatmap buckets values into one band per palette colour, so two stops
 * alone would give a two-tone grid. A single colour ramps up from a pale tint of
 * itself (`base` is the low end: near white on light themes, near black on dark).
 */
export function expandRamp(stops: string[], steps = HEATMAP_STEPS, base = "#f7f7f7"): string[] {
  const ramp = stops.length === 1 ? [rampColor([base, stops[0]!], 0.08), stops[0]!] : stops;
  return Array.from({ length: steps }, (_, i) => rampColor(ramp, i / (steps - 1)));
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

/**
 * A Vega-Lite spec the plot can render, or null while it is still streaming in.
 * Data must be inline: any `url` (data, images) is removed, so a spec never fetches anything.
 */
export function toPlotSpec(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const strip = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(strip);
    if (!node || typeof node !== "object") return node;
    return Object.fromEntries(
      Object.entries(node as Record<string, unknown>)
        .filter(([key]) => key !== "url" && key !== "$schema" && key !== "usermeta")
        .map(([key, value]) => [key, strip(value)]),
    );
  };
  const spec = strip(raw) as Record<string, unknown>;
  const drawable = ["mark", "layer", "hconcat", "vconcat", "concat", "facet", "repeat", "spec"].some((k) => k in spec);
  return drawable ? spec : null;
}
