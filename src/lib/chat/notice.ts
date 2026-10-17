/**
 * A standalone OpenUI Lang answer holding one Callout. The chat renders content
 * as OpenUI Lang, so plain-text notices would fail to parse. A later `root`
 * overrides an earlier one, so this also replaces a partial answer that ended
 * on a statement boundary.
 */
export function openuiNotice(variant: "info" | "error", title: string, description: string): string {
  return `\nroot = Stack([copilotNotice])\ncopilotNotice = Callout(${JSON.stringify(variant)}, ${JSON.stringify(title)}, ${JSON.stringify(description)})\n`;
}
