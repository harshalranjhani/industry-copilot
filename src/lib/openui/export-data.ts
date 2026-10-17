/** Pulls the data behind an answer's tables, charts, maps and heatmaps out of its parsed OpenUI tree, for CSV and PDF downloads. */

export type Cell = string | number;

export interface DataTable {
  title: string;
  columns: string[];
  rows: Cell[][];
}

export interface SourceRow {
  kind: string;
  reference: string;
  label: string;
}

export interface AnswerData {
  /** The first card header's title, if any. */
  title?: string;
  subtitle?: string;
  tables: DataTable[];
  sources: SourceRow[];
}

type Node = { type?: string; typeName?: string; props?: Record<string, unknown> };

const isElement = (n: unknown): n is Node => !!n && typeof n === "object" && (n as Node).type === "element";
const propsOf = (n: unknown): Record<string, unknown> => (isElement(n) ? (n.props ?? {}) : ((n as Record<string, unknown>) ?? {}));
const array = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const cell = (v: unknown): Cell => (typeof v === "number" ? v : v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));
const text = (v: unknown): string => (typeof v === "string" ? v : "");

const SERIES_CHARTS = new Set(["BarChart", "HorizontalBarChart", "LineChart", "AreaChart", "RadarChart"]);
const VALUE_CHARTS = new Set(["PieChart", "RadialChart", "SingleStackedBarChart"]);
const CHART_NAMES: Record<string, string> = {
  BarChart: "Bar chart",
  HorizontalBarChart: "Bar chart",
  LineChart: "Line chart",
  AreaChart: "Area chart",
  RadarChart: "Radar chart",
  PieChart: "Pie chart",
  RadialChart: "Radial chart",
  SingleStackedBarChart: "Stacked bar",
  ScatterChart: "Scatter chart",
  Table: "Table",
  Plot: "Chart",
  GeoMap: "Map",
  Heatmap: "Heatmap",
};

/** Rows of objects as a table, with the union of their keys as columns in first-seen order. */
function objectRows(rows: unknown[]): { columns: string[]; rows: Cell[][] } {
  const objects = rows.filter((r): r is Record<string, unknown> => !!r && typeof r === "object" && !Array.isArray(r));
  const columns = [...new Set(objects.flatMap((o) => Object.keys(o)))];
  return { columns, rows: objects.map((o) => columns.map((c) => cell(o[c]))) };
}

/** Inline data of a Vega-Lite spec: its own and every layer's or nested spec's data.values, deduplicated by content. */
function plotValues(spec: unknown): unknown[][] {
  const found: unknown[][] = [];
  const seen = new Set<string>();
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    const values = (o.data as Record<string, unknown> | undefined)?.values;
    if (Array.isArray(values) && values.length) {
      const key = JSON.stringify(values);
      if (!seen.has(key)) {
        seen.add(key);
        found.push(values);
      }
    }
    for (const k of ["layer", "hconcat", "vconcat", "concat"]) array(o[k]).forEach(visit);
    if (o.spec) visit(o.spec);
  };
  visit(spec);
  return found;
}

function tableOf(node: Node, title: string): DataTable[] {
  const p = node.props ?? {};
  const name = node.typeName ?? "";
  if (name === "Table") {
    const cols = array(p.columns).map(propsOf);
    const length = Math.max(0, ...cols.map((c) => array(c.data).length));
    return [{
      title,
      columns: cols.map((c) => text(c.label)),
      rows: Array.from({ length }, (_, i) => cols.map((c) => cell(array(c.data)[i]))),
    }];
  }
  if (SERIES_CHARTS.has(name)) {
    const labels = array(p.labels);
    const series = array(p.series).map(propsOf);
    return [{
      title,
      columns: [text(p.xLabel) || "Category", ...series.map((s) => text(s.category))],
      rows: labels.map((label, i) => [cell(label), ...series.map((s) => cell(array(s.values)[i]))]),
    }];
  }
  if (VALUE_CHARTS.has(name)) {
    const labels = array(p.labels);
    const values = array(p.values);
    return [{ title, columns: ["Category", "Value"], rows: labels.map((l, i) => [cell(l), cell(values[i])]) }];
  }
  if (name === "ScatterChart") {
    const rows = array(p.datasets).map(propsOf).flatMap((d) =>
      array(d.points).map(propsOf).map((pt) => [text(d.name), cell(pt.x), cell(pt.y)]),
    );
    return [{ title, columns: ["Series", text(p.xLabel) || "x", text(p.yLabel) || "y"], rows }];
  }
  if (name === "Plot") {
    return plotValues(p.spec).map((values, i, all) => ({
      title: all.length > 1 ? `${title} (data ${i + 1})` : title,
      ...objectRows(values),
    }));
  }
  if (name === "GeoMap") {
    const points = array(p.points).map(propsOf);
    const extra = (["detail", "value", "group"] as const).filter((k) => points.some((pt) => pt[k] !== undefined));
    return [{
      title,
      columns: ["Label", "Latitude", "Longitude", ...extra.map((k) => k[0]!.toUpperCase() + k.slice(1))],
      rows: points.map((pt) => [cell(pt.label), cell(pt.lat), cell(pt.lon), ...extra.map((k) => cell(pt[k]))]),
    }];
  }
  if (name === "Heatmap") {
    const columns = array(p.columns).map(cell);
    return [{
      title,
      columns: ["", ...columns.map(String)],
      rows: array(p.rows).map((row, r) => [cell(row), ...columns.map((_, c) => cell(array(array(p.values)[r])[c]))]),
    }];
  }
  return [];
}

/** Every data-bearing component in reading order, titled by the card header above it. */
export function extractAnswerData(root: unknown): AnswerData {
  const data: AnswerData = { tables: [], sources: [] };
  let heading: string | undefined;
  const counts = new Map<string, number>();

  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!isElement(node)) return;
    const name = node.typeName ?? "";
    const p = node.props ?? {};
    if (name === "CardHeader") {
      heading = text(p.title) || heading;
      if (data.title === undefined && text(p.title)) {
        data.title = text(p.title);
        data.subtitle = text(p.subtitle) || undefined;
      }
    }
    if (name === "Sources") {
      data.sources.push(...array(p.items).map(propsOf).map((s) => ({ kind: text(s.kind), reference: text(s.reference), label: text(s.label) })));
      return;
    }
    if (CHART_NAMES[name]) {
      const kind = name === "Plot" && typeof (p.spec as Record<string, unknown> | undefined)?.title === "string"
        ? String((p.spec as Record<string, unknown>).title)
        : CHART_NAMES[name]!;
      const n = (counts.get(kind) ?? 0) + 1;
      counts.set(kind, n);
      const title = heading && heading !== kind ? `${heading} · ${kind}` : n > 1 ? `${kind} ${n}` : kind;
      data.tables.push(...tableOf(node, title).filter((t) => t.columns.length && t.rows.length));
      return;
    }
    Object.values(p).forEach(visit);
  };
  visit(root);
  return data;
}

const csvCell = (c: Cell) => {
  const s = String(c);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** All the answer's tables in one CSV, each under its own title row, then the sources. */
export function answerCsv(data: AnswerData): string {
  const blocks = data.tables.map((t) => [[t.title], t.columns, ...t.rows].map((r) => r.map(csvCell).join(",")).join("\n"));
  if (data.sources.length) {
    blocks.push([["Sources"], ["Kind", "Reference", "Supports"], ...data.sources.map((s) => [s.kind, s.reference, s.label])]
      .map((r) => r.map(csvCell).join(","))
      .join("\n"));
  }
  return `${blocks.join("\n\n")}\n`;
}

const PDF_SAFE: Record<string, string> = { "→": "->", "←": "<-", "≥": ">=", "≤": "<=", "✕": "x", "✓": "v", "−": "-", "–": "-" };

/** Text for the PDF's built-in fonts, which only cover Latin-1: common symbols get ASCII stand-ins, others are dropped. */
export function pdfText(value: Cell): string {
  return String(value)
    .replace(/[→←≥≤✕✓−–]/g, (c) => PDF_SAFE[c]!)
    .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff—…‘’“”•]/g, "");
}

/** A file name from the answer's title, e.g. "well-0001-is-not-producing-oil". */
export function exportFileName(title: string | undefined, extension: string): string {
  const base = (title ?? "copilot-answer").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `${base || "copilot-answer"}.${extension}`;
}
