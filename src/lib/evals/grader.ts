import type { Api, Model, Models } from "@earendil-works/pi-ai";
import type { ExpectedVisual, ScenarioStep } from "./scenarios";

/** The grader's verdict on one answer. */
export interface Grade {
  /** Every expected fact matched, sources cited, and the visual fits. Computed here, never taken from the grader. */
  pass: boolean;
  matchedFacts: string[];
  missedFacts: string[];
  /** Whether the answer cites the records and documents it used. */
  sourcesCited: boolean;
  /** Whether the answer shows the visual the question asks for (always true when none is expected). */
  visualMatches: boolean;
  comment: string;
}

export interface GraderOptions {
  models: Models;
  model: Model<Api>;
  getApiKey?: (provider: string) => string | undefined;
}

const VISUAL_NAMES: Record<ExpectedVisual, string> = {
  none: "no particular visual is required",
  card: "a card (Card)",
  table: "a table (Table)",
  line_chart: "a line chart (LineChart, or a Plot whose spec draws lines)",
  area_chart: "an area chart (AreaChart, or a Plot whose spec draws areas)",
  bar_chart: "a bar chart (BarChart, HorizontalBarChart, or a Plot whose spec draws bars)",
  scatter_chart: "a scatter plot (ScatterChart, or a Plot whose spec draws points against two quantities)",
  timeline: "a timeline or Gantt chart (a Plot with bars from a start date to an end date)",
  map: "a map (GeoMap)",
  heatmap: "a heatmap (Heatmap, or a Plot whose spec draws rect cells)",
};

const SYSTEM_PROMPT = `You grade answers from an oil-field asset copilot against what a correct answer must say. The answer is written in OpenUI Lang: components such as Card, Table, LineChart, BarChart, GeoMap, Heatmap, Plot, TextContent, Callout and Sources. Plot holds a Vega-Lite spec: read its marks, encodings, colour scales, layers, transforms and data values. GeoMap pins carry color, group and size, and its options set the basemap, colouring, labels and legend.

Judge three things:
1. Facts: which of the numbered expected facts the answer states correctly. Numbers, names, IDs and dates must match; wording may differ. A fact counts when the answer's text or its chart/table data carries it. A fact about how a visual looks (a colour, orientation, mark, dashed or reference line, basemap, labels) counts when the visual's spec or options do it; colour names and equivalent hex codes both match. A visual fact that lists several properties (for example colouring, sizing and labels) counts only when the spec or options set every one of them; a property the text claims but the spec or options do not set does not count. A contradicted or missing fact does not count.
2. Evidence: whether the answer cites the records and documents it used (a Sources component, or record IDs and document references in the text).
3. Visual: whether the answer shows the expected visual. When none is required, answer true.

Reply with only a JSON object, no other text:
{"matched": [1-based numbers of the expected facts the answer states], "sourcesCited": true or false, "visualMatches": true or false, "comment": "one short sentence on what is wrong, or ok"}`;

function userPrompt(step: ScenarioStep, answer: string): string {
  return [
    `Question: ${step.question}`,
    "",
    "Expected facts:",
    ...step.expectedFacts.map((fact, i) => `${i + 1}. ${fact}`),
    "",
    `Expected visual: ${VISUAL_NAMES[step.expectedVisual]}`,
    "",
    "Answer (OpenUI Lang):",
    answer,
  ].join("\n");
}

/** The JSON object in the grader's reply, which may be wrapped in a code fence or prose. */
function parseVerdict(text: string): { matched: unknown; sourcesCited: unknown; visualMatches: unknown; comment: unknown } | undefined {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) return undefined;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** A step that fails without a usable verdict: every fact counts as missed. */
export const failed = (step: ScenarioStep, comment: string): Grade => ({
  pass: false,
  matchedFacts: [],
  missedFacts: step.expectedFacts,
  sourcesCited: false,
  visualMatches: false,
  comment,
});

/** Has the grader model judge one answer against the step's expectations. A grader that cannot be read fails the step. */
export async function gradeAnswer(grader: GraderOptions, step: ScenarioStep, answer: string): Promise<Grade> {
  let reply: string;
  try {
    const message = await grader.models.completeSimple(
      grader.model,
      { systemPrompt: SYSTEM_PROMPT, messages: [{ role: "user", content: userPrompt(step, answer), timestamp: Date.now() }] },
      { apiKey: grader.getApiKey?.(grader.model.provider) },
    );
    if (message.stopReason === "error") return failed(step, `The grader model failed: ${message.errorMessage ?? "unknown error"}`);
    reply = message.content.map((part) => (part.type === "text" ? part.text : "")).join("");
  } catch (err) {
    return failed(step, `The grader model failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const verdict = parseVerdict(reply);
  if (!verdict) return failed(step, `The grader gave no readable verdict: ${reply.slice(0, 200)}`);

  const matchedNumbers = new Set(Array.isArray(verdict.matched) ? verdict.matched.map(Number) : []);
  const matchedFacts = step.expectedFacts.filter((_, i) => matchedNumbers.has(i + 1));
  const missedFacts = step.expectedFacts.filter((_, i) => !matchedNumbers.has(i + 1));
  const sourcesCited = verdict.sourcesCited === true;
  const visualMatches = step.expectedVisual === "none" || verdict.visualMatches === true;
  return {
    pass: missedFacts.length === 0 && sourcesCited && visualMatches,
    matchedFacts,
    missedFacts,
    sourcesCited,
    visualMatches,
    comment: typeof verdict.comment === "string" ? verdict.comment : "",
  };
}
