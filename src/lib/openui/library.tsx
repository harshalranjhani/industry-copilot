"use client";

import { type DefinedComponent, defineComponent } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { z } from "zod";
import { GeoMapView } from "./geo-map";
import { HeatmapView } from "./heatmap";
import { toColor } from "./visuals";
import { type ReactNode, cloneElement, isValidElement } from "react";

const SOURCE_KINDS = [
  "inspection",
  "repair",
  "report",
  "regulator_event",
  "note",
  "knowledge",
  "document",
] as const;

const SourceItem = defineComponent({
  name: "SourceItem",
  props: z.object({
    kind: z.enum(SOURCE_KINDS),
    reference: z
      .string()
      .describe('Record ID (e.g. "INS-0001-0203") or document section (e.g. "SOP-SR-01 §3")'),
    label: z.string().describe("What this source supports, in a few words"),
  }),
  description: "One cited record or document section",
  component: () => null,
});

const Sources = defineComponent({
  name: "Sources",
  props: z.object({ items: z.array(SourceItem.ref) }),
  description:
    "Evidence block citing every record and document section the answer used. Required as the last child of the root Stack in every answer.",
  component: ({ props }) => {
    const items = (props.items ?? []).flatMap((item) => {
      const source = (
        item as { props?: { kind?: string; reference?: string; label?: string } } | null
      )?.props;
      return source ? [source] : [];
    });
    return (
      <section className="copilot-sources" aria-label="Sources">
        <h4>Sources</h4>
        {items.length === 0 ? (
          <p className="copilot-sources-empty">No sources cited.</p>
        ) : (
          <ul>
            {items.map((s, i) => (
              <li key={`${s.reference}-${i}`}>
                <span className="copilot-sources-kind">{s.kind?.replace("_", " ")}</span>
                <code>{s.reference}</code>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  },
});

const GeoMap = defineComponent({
  name: "GeoMap",
  props: z.object({
    points: z
      .array(
        z.object({
          lat: z.number(),
          lon: z.number(),
          label: z.string().describe("Short name shown on the pin, e.g. the well ID"),
          detail: z.string().optional().describe("One line shown under the label in the popup"),
          value: z.number().optional().describe("A number shown in the popup, e.g. a volume"),
          group: z.string().optional().describe('Legend category, e.g. "Not producing"; pins of one group share a colour'),
          color: z.string().optional().describe('CSS colour for this pin, e.g. "red" or "#d62828"'),
          size: z.number().optional().describe("Pin radius in pixels (default 8), e.g. scaled by volume"),
        }),
      )
      .describe("One entry per location, with coordinates taken from tool results"),
    options: z
      .object({
        basemap: z.enum(["streets", "light", "dark", "satellite", "topo"]).optional(),
        colorBy: z.enum(["group", "value"]).optional().describe("group: one colour per group; value: a colour ramp over value"),
        palette: z.array(z.string()).optional().describe("Group colours in order, or the low-to-high ramp for colorBy value"),
        legendTitle: z.string().optional(),
        showLabels: z.boolean().optional().describe("Keep every pin's label visible"),
        connect: z.boolean().optional().describe("Draw a line through the pins in order, e.g. a route"),
      })
      .optional()
      .describe("Styling the user asked for; omit for the default map"),
  }),
  description:
    "Interactive map with one pin per location, auto-fitted to the pins, with a legend when pins have groups or are coloured by value. Use it whenever the answer is about where wells are, e.g. 'show me', 'where are' or 'on a map'. Style it as the user asks: colour pins by group (set group, and color or options.palette), by value (options.colorBy \"value\"), size them, pick a basemap, show labels or connect them.",
  component: ({ props }) => <GeoMapView points={props.points} options={props.options} />,
});

const Heatmap = defineComponent({
  name: "Heatmap",
  props: z.object({
    rows: z.array(z.string()).describe('Row labels, e.g. area names'),
    columns: z.array(z.string()).describe('Column labels, e.g. months'),
    values: z
      .array(z.array(z.number()))
      .describe("One array per row, with one number per column, in the same order as the labels"),
    rowTotals: z.array(z.number()).optional().describe("Optional total of each row"),
    columnTotals: z.array(z.number()).optional().describe("Optional total of each column"),
    palette: z
      .array(z.string())
      .optional()
      .describe('Colours the user asks for, drawn as a smooth gradient: one colour for its shades (["red"]), or several low to high'),
    diverging: z.boolean().optional().describe("true when values are signed around zero"),
  }),
  description:
    "Colour-coded grid of numbers across two dimensions, such as area × month. Use it for any question that compares a count or amount across two categories; use a Table when exact values are all that matter. Cells show their values; totals appear in the labels.",
  component: ({ props }) => <HeatmapView {...props} />,
});

/**
 * One of OpenUI's charts with a trailing `colors` argument: the stock renderer's
 * chart element, given those colours as its palette. So "make it red" works on
 * a fixed chart too, not only on a Plot.
 */
function withColors(base: DefinedComponent): DefinedComponent {
  return defineComponent({
    name: base.name,
    props: (base.props as z.ZodObject).extend({
      colors: z
        .array(z.string())
        .optional()
        .describe("CSS colours in order: one per series (or per slice), e.g. [\"red\"]. Pass null for skipped optional arguments before it"),
    }),
    description: `${base.description}. Set colors to recolour it`,
    component: (renderProps) => {
      // A null placeholder for a skipped optional argument means "not given" to the stock renderer.
      const props = Object.fromEntries(Object.entries(renderProps.props).map(([k, v]) => [k, v ?? undefined]));
      const element = base.component({ ...renderProps, props } as never);
      const raw = (props as { colors?: unknown }).colors;
      const palette = Array.isArray(raw) ? raw.map(toColor).filter((c): c is string => !!c) : [];
      return palette.length && isValidElement(element)
        ? cloneElement(element as React.ReactElement<{ customPalette?: string[] }>, { customPalette: palette })
        : element;
    },
  }) as DefinedComponent;
}

const COLOURABLE_CHARTS = ["BarChart", "HorizontalBarChart", "LineChart", "AreaChart", "PieChart", "RadarChart"] as const;

export interface PlotRenderProps {
  spec?: unknown;
  height?: unknown;
}

const plotComponent = (renderPlot: (props: PlotRenderProps) => ReactNode) => defineComponent({
  name: "Plot",
  props: z.object({
    spec: z
      .record(z.string(), z.unknown())
      .describe("A Vega-Lite v6 spec with inline data: {data: {values: [...]}, mark, encoding} or {layer: [...]}"),
    height: z.number().optional().describe("Plot height in pixels; the width always fills the card"),
  }),
  description:
    "Any chart Vega-Lite can draw, for what the fixed charts cannot do: colours the user picks, horizontal or vertical bars, line + point layers that mark readings, threshold or reference lines (rule marks), dual axes, scatter, area, timelines (bar with x and x2 dates), box plots, small multiples, and heatmaps in chosen colours. Data rows come only from tool results.",
  component: ({ props }) => renderPlot({ spec: props.spec, height: props.height }),
});

/**
 * OpenUI's built-in library plus the copilot's custom components. The plot's
 * renderer is passed in: the app gives the Vega one (app-library.tsx), while the
 * prompt generator and tests, which can't bundle Vega for Node, give a stub.
 */
export const createCopilotLibrary = (renderPlot: (props: PlotRenderProps) => ReactNode) =>
  openuiLibrary.extend({
    components: {
      add: [
        SourceItem,
        Sources,
        { component: GeoMap, slots: ["Card.children"] },
        { component: Heatmap, slots: ["Card.children"] },
        { component: plotComponent(renderPlot), slots: ["Card.children"] },
      ],
      override: COLOURABLE_CHARTS.map((name) => withColors(openuiLibrary.components[name] as DefinedComponent)),
    },
  });

/** The library without a plot renderer: enough to generate the prompt and to parse answers. */
export const promptLibrary = createCopilotLibrary(() => null);
