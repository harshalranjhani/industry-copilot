import type { DigestInput } from "./store";

const MAX_TITLE = 60;
const MAX_SUMMARY = 240;
const MAX_RECORD_IDS = 30;

/** A conversation's title: its first message on one line, shortened. */
export function conversationTitle(firstMessage: string): string {
  const line = firstMessage.replace(/\s+/g, " ").trim() || "New conversation";
  return line.length > MAX_TITLE ? `${line.slice(0, MAX_TITLE - 1)}…` : line;
}

/** The text of one Pi (or OpenUI) message, whether its content is a string or content parts. */
export function messageText(message: unknown): string {
  const content = (message as { content?: unknown } | null)?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (part && typeof part === "object" && (part as { type?: string }).type === "text" ? String((part as { text?: unknown }).text ?? "") : ""))
    .join("");
}

const unique = (values: Iterable<string>) => [...new Set(values)];

/** The first prose line of an OpenUI Lang answer, or undefined. */
function firstProse(answer: string): string | undefined {
  for (const match of answer.matchAll(/TextContent\(("(?:[^"\\]|\\.)*")/g)) {
    try {
      const text = String(JSON.parse(match[1]!)).replace(/\s+/g, " ").trim();
      if (text) return text;
    } catch {
      // not a plain string literal; try the next one
    }
  }
  return undefined;
}

/**
 * What an answer leaves in the user's private memory: the question, the wells,
 * areas and record IDs the answer named, and a one-line summary.
 */
export function digestFromAnswer(input: { question: string; answer: string; areaNames: string[] }): DigestInput {
  const { question, answer, areaNames } = input;
  const summary = (firstProse(answer) ?? question).replace(/\s+/g, " ");
  return {
    question: question.replace(/\s+/g, " ").trim(),
    wells: unique(answer.match(/WELL-\d+/g) ?? []),
    areas: areaNames.filter((name) => answer.includes(name)),
    recordIds: unique(answer.match(/\b(?:INS|MNT|CTX|REG|KN)-\d+(?:-\d+)?\b/g) ?? []).slice(0, MAX_RECORD_IDS),
    summary: summary.length > MAX_SUMMARY ? `${summary.slice(0, MAX_SUMMARY - 1)}…` : summary,
  };
}

/** The user and assistant text of a stored Pi transcript, for reading an earlier conversation back. */
export function transcriptText(transcript: unknown[]): Array<{ role: "user" | "assistant"; text: string }> {
  return transcript.flatMap((message) => {
    const role = (message as { role?: string } | null)?.role;
    const text = messageText(message).trim();
    return (role === "user" || role === "assistant") && text ? [{ role, text }] : [];
  });
}
