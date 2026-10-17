import type { UsageSummary } from "./usage";
import { type AGUIEvent, EventType, type StreamProtocolAdapter } from "@openuidev/react-headless";

/** One line of the chat route's NDJSON stream: an OpenAI `chat.completion.chunk`. */
interface ChatChunk {
  usage?: UsageSummary;
  choices?: Array<{
    delta?: {
      role?: string;
      content?: string;
      tool_call_id?: string;
      is_error?: boolean;
      tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }>;
    };
    finish_reason?: string | null;
  }>;
}

async function* ndjsonLines(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) yield line;
  }
  if (buffer.trim()) yield buffer;
}

/**
 * Parses the chat route's stream for the OpenUI chat shell. Like OpenUI's
 * `openAIReadableStreamAdapter`, plus tool results (`role: "tool"` deltas) so
 * the tool trace shows each call completing with its output.
 */
export const copilotStreamAdapter = (onUsage?: (messageId: string, usage: UsageSummary) => void): StreamProtocolAdapter => ({
  async *parse(response: Response): AsyncIterable<AGUIEvent> {
    const messageId = crypto.randomUUID();
    let started = false;

    for await (const line of ndjsonLines(response)) {
      let chunk: ChatChunk;
      try {
        chunk = JSON.parse(line) as ChatChunk;
      } catch {
        continue;
      }
      if (chunk.usage) onUsage?.(messageId, chunk.usage);
      const choice = chunk.choices?.[0];
      const delta = choice?.delta;
      if (!delta) continue;

      if (delta.role === "tool") {
        if (delta.tool_call_id) {
          yield {
            type: EventType.TOOL_CALL_RESULT,
            messageId: crypto.randomUUID(),
            toolCallId: delta.tool_call_id,
            content: delta.content ?? "",
            ...(delta.is_error ? { isError: true } : {}),
          };
        }
        continue;
      }

      if (!started && (delta.role || delta.content)) {
        started = true;
        yield { type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" };
      }
      if (delta.content) {
        yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: delta.content };
      }
      for (const call of delta.tool_calls ?? []) {
        if (!call.id) continue;
        yield { type: EventType.TOOL_CALL_START, toolCallId: call.id, toolCallName: call.function?.name ?? "" };
        if (call.function?.arguments) {
          yield { type: EventType.TOOL_CALL_ARGS, toolCallId: call.id, delta: call.function.arguments };
        }
        yield { type: EventType.TOOL_CALL_END, toolCallId: call.id };
      }
      if (choice?.finish_reason === "stop") {
        yield { type: EventType.TEXT_MESSAGE_END, messageId };
      }
    }
  },
});
