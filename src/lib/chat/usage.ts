/** What one answer cost, as the chat route reports it and the footer shows it. */
export interface UsageSummary {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
}

const integerFormat = new Intl.NumberFormat("en-US");

/** One line for the footer: "anthropic/claude-sonnet-5.5 · 1,204 in / 310 out · $0.0072 · 3.4 s". */
export function formatUsage(u: UsageSummary): string {
  const cost = u.costUsd > 0 && u.costUsd < 0.0001 ? "<$0.0001" : `$${u.costUsd.toFixed(4)}`;
  return `${u.model} · ${integerFormat.format(u.inputTokens)} in / ${integerFormat.format(u.outputTokens)} out · ${cost} · ${(u.latencyMs / 1000).toFixed(1)} s`;
}

type Listener = () => void;
const live = new Map<string, UsageSummary>();
const listeners = new Set<Listener>();

/** Usage of answers streamed in this browser session, by the ID of the message they belong to. */
export const liveUsage = {
  set(messageId: string, usage: UsageSummary) {
    live.set(messageId, usage);
    listeners.forEach((l) => l());
  },
  get: (messageId: string): UsageSummary | undefined => live.get(messageId),
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
};
