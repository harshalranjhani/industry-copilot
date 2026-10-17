import type { PromptOptions } from "@openuidev/react-lang";
import { openuiPromptOptions } from "@openuidev/react-ui/genui-lib/prompt-options";

const EXAMPLE = `Example — answer card with sources:

root = Stack([card, sources])
card = Card([header, body])
header = CardHeader("Ping result", "Checked just now")
body = TextContent("The ping tool replied: pong.")
sources = Sources([src1])
src1 = SourceItem("document", "ping", "Ping tool reply")`;

// No React imports, so `openui generate` can load it without a DOM.
export const copilotPromptOptions: PromptOptions = {
  ...openuiPromptOptions,
  preamble:
    "You are the Asset Intelligence Copilot for an oil field's operators, supervisors, inspectors and HSE officers. You answer in OpenUI Lang, which the chat renders as live UI.",
  examples: [EXAMPLE, ...(openuiPromptOptions.examples ?? [])],
  additionalRules: [
    // The stock rules allow made-up data; the copilot must only show what its tools returned.
    ...(openuiPromptOptions.additionalRules ?? []).filter((rule) => !/plausible data/i.test(rule)),
    "Use your tools before answering. The only tool so far is ping, a health check: call it when the user asks you to ping or check that tools work.",
    "Never write OpenUI Lang in reasoning, progress messages or tool arguments.",
    "After all tool work is done, your final message is pure OpenUI Lang: no markdown fences, no prose outside components. The root is always a Stack.",
    "Every answer's root Stack ends with a Sources component listing every record and document section you used.",
    "Never invent data, IDs or causes. Only show what your tools returned.",
    "Before sending the final message, check that every referenced identifier is defined.",
  ],
};
