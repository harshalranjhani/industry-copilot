"use client";

import { type AssistantMessage, useThread, useThreadList } from "@openuidev/react-headless";
import { BuiltinActionType, type ActionEvent, Renderer } from "@openuidev/react-lang";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { formatUsage, liveUsage, type UsageSummary } from "@/lib/chat/usage";
import { copilotLibrary } from "@/lib/openui/library";

type SavedUsage = Record<string, UsageSummary>;
const FRESH_MS = 3000;

/** Fetches a thread's saved usage; the answers of one thread share a request made within the last few seconds. */
const savedUsageRequests = new Map<string, { at: number; request: Promise<SavedUsage> }>();
function fetchSavedUsage(threadId: string, headers: Record<string, string>): Promise<SavedUsage> {
  const recent = savedUsageRequests.get(threadId);
  if (recent && Date.now() - recent.at < FRESH_MS) return recent.request;
  const request = fetch(`/api/threads/usage/${encodeURIComponent(threadId)}`, { headers })
    .then((res) => (res.ok ? res.json() : { usage: {} }))
    .then((body: { usage?: SavedUsage }) => body.usage ?? {})
    .catch(() => ({}));
  savedUsageRequests.set(threadId, { at: Date.now(), request });
  return request;
}

function useSavedUsage(threadId: string | null, headers: Record<string, string>): SavedUsage | undefined {
  const [saved, setSaved] = useState<{ threadId: string; usage: SavedUsage }>();
  useEffect(() => {
    if (!threadId) return;
    let cancelled = false;
    void fetchSavedUsage(threadId, headers).then((usage) => {
      if (!cancelled) setSaved({ threadId, usage });
    });
    return () => {
      cancelled = true;
    };
    // The headers belong to the user; the chat remounts when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);
  return saved?.threadId === threadId ? saved.usage : undefined;
}

/**
 * Renders an OpenUI answer like the shell's default, with a small footer naming the
 * model, tokens, cost and latency of that answer. Answers streamed just now carry
 * their usage from the stream; reloaded ones get it from the saved thread.
 */
export function usageAssistantMessage(headers: Record<string, string>) {
  return function AssistantMessageWithUsage({ message, isStreaming }: { message: AssistantMessage; isStreaming: boolean }) {
    const processMessage = useThread((s) => s.processMessage);
    const threadId = useThreadList((s) => s.selectedThreadId);
    const streamed = useSyncExternalStore(liveUsage.subscribe, () => liveUsage.get(message.id));
    const saved = useSavedUsage(isStreaming || streamed ? null : threadId, headers);
    const usage = streamed ?? saved?.[message.id];

    const onAction = useCallback(
      (event: ActionEvent) => {
        if (event.type === BuiltinActionType.ContinueConversation && event.humanFriendlyMessage) {
          void processMessage({ role: "user", content: event.humanFriendlyMessage });
        } else if (event.type === BuiltinActionType.OpenUrl && typeof event.params?.url === "string") {
          window.open(event.params.url, "_blank");
        }
      },
      [processMessage],
    );

    return (
      <div className="openui-agent-thread-message-assistant">
        <div className="openui-agent-thread-message-assistant__content">
          {message.content && (
            <Renderer response={message.content} library={copilotLibrary} isStreaming={isStreaming} onAction={onAction} />
          )}
          {usage && message.content && !isStreaming && (
            <p className="copilot-usage mt-3 text-xs" data-testid="answer-usage">
              {formatUsage(usage)}
            </p>
          )}
        </div>
      </div>
    );
  };
}
