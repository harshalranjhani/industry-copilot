"use client";

import { defineComponent } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { z } from "zod";

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

/** OpenUI's built-in library plus the copilot's custom components. Created once. */
export const copilotLibrary = openuiLibrary.extend({
  components: { add: [SourceItem, Sources] },
});
