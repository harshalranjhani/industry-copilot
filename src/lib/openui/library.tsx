"use client";

import { defineComponent } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { z } from "zod";
import { GeoMapView } from "./geo-map";
import { HeatmapView } from "./heatmap";

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
        }),
      )
      .describe("One entry per location, with coordinates taken from tool results"),
  }),
  description:
    "Interactive map with one pin per location, auto-fitted to the pins. Use it whenever the answer is about where wells are, e.g. 'show me', 'where are' or 'on a map'.",
  component: ({ props }) => <GeoMapView points={props.points} />,
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
  }),
  description:
    "Colour-coded grid of numbers across two dimensions, such as area × month. Use it for any question that compares a count or amount across two categories; use a Table when exact values are all that matter. Cells show their values; totals appear in the labels.",
  component: ({ props }) => <HeatmapView {...props} />,
});

/** OpenUI's built-in library plus the copilot's custom components. Created once. */
export const copilotLibrary = openuiLibrary.extend({
  components: {
    add: [
      SourceItem,
      Sources,
      { component: GeoMap, slots: ["Card.children"] },
      { component: Heatmap, slots: ["Card.children"] },
    ],
  },
});
