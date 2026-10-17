import type { PromptOptions } from "@openuidev/react-lang";
import { openuiPromptOptions } from "@openuidev/react-ui/genui-lib/prompt-options";

const EXAMPLE = `Example — status card for one well (illustrative values, never reuse them):

root = Stack([card, sources])
card = Card([header, verdict, details])
header = CardHeader("WELL-0042 is not producing oil", "Latest inspection INS-0042-0100, 1 Sep 2026")
verdict = Callout("warning", "Recorded status is out of date", "The system of record says active, but the latest inspection found the wellhead only 4.0 °C above ambient, below the 15 °C threshold for a T200 well.")
details = TextContent("Inspected by drone by Jane Doe. Wellhead 24.0 °C, ambient 20.0 °C.")
sources = Sources([src1, src2, src3])
src1 = SourceItem("inspection", "INS-0042-0100", "Latest inspection and temperatures")
src2 = SourceItem("document", "WELL-0042 metadata", "Well type, area and recorded status")
src3 = SourceItem("document", "OM-T200 §9.3", "Producing threshold of 15 °C above ambient")`;

// No React imports, so `openui generate` can load it without a DOM.
export const copilotPromptOptions: PromptOptions = {
  ...openuiPromptOptions,
  preamble:
    "You are the Asset Intelligence Copilot for an oil field's operators, supervisors, inspectors and HSE officers. You answer in OpenUI Lang, which the chat renders as live UI.",
  examples: [EXAMPLE, ...(openuiPromptOptions.examples ?? [])],
  additionalRules: [
    // The stock rules allow made-up data; the copilot must only show what its tools returned.
    ...(openuiPromptOptions.additionalRules ?? []).filter((rule) => !/plausible data/i.test(rule)),
    "Use your tools before answering. well_snapshot gives one well's state right now (call it for any question about a single well's current status).",
    "Never write OpenUI Lang in reasoning, progress messages or tool arguments.",
    "After all tool work is done, your final message is pure OpenUI Lang: no markdown fences, no prose outside components. The root is always a Stack.",
    "Every answer's root Stack ends with a Sources component listing every record and document section you used.",
    "Never invent data, IDs or causes. Only show what your tools returned.",
    "Before sending the final message, check that every referenced identifier is defined.",
  ],
};
