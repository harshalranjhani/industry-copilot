"use client";

import { type AssistantMessage, useThread, useThreadList } from "@openuidev/react-headless";
import { BuiltinActionType, type ActionEvent, Renderer } from "@openuidev/react-lang";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { formatUsage, liveUsage, type UsageSummary } from "@/lib/chat/usage";
import { copilotLibrary } from "@/lib/openui/app-library";
import { AnswerActions } from "./answer-actions";

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

const textOf = (content: unknown): string =>
  typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part) => (part && typeof part === "object" && "text" in part ? String(part.text) : "")).join("")
      : "";

/**
 * Renders an OpenUI answer like the shell's default, with a footer naming the
 * model, tokens, cost and latency of that answer and its download actions.
 * Answers streamed just now carry their usage from the stream; reloaded ones get
 * it from the saved thread. `askedBy` names the user for downloaded PDFs.
 */
export function usageAssistantMessage(headers: Record<string, string>, askedBy: string) {
  return function AssistantMessageWithUsage({ message, isStreaming }: { message: AssistantMessage; isStreaming: boolean }) {
    const processMessage = useThread((s) => s.processMessage);
    const threadId = useThreadList((s) => s.selectedThreadId);
    const streamed = useSyncExternalStore(liveUsage.subscribe, () => liveUsage.get(message.id));
    const saved = useSavedUsage(isStreaming || streamed ? null : threadId, headers);
    const usage = streamed ?? saved?.[message.id];
    const answerRef = useRef<HTMLDivElement>(null);
    const messages = useThread((s) => s.messages);
    // The question this answer replies to: the closest user message before it.
    const question = useMemo(() => {
      const index = messages.findIndex((m) => m.id === message.id);
      const before = index < 0 ? [] : messages.slice(0, index);
      const asked = before.findLast((m) => m.role === "user");
      return asked ? textOf(asked.content).trim() || undefined : undefined;
    }, [messages, message.id]);

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
            <div ref={answerRef} className="copilot-answer">
              <Renderer response={message.content} library={copilotLibrary} isStreaming={isStreaming} onAction={onAction} />
            </div>
          )}
          {message.content && !isStreaming && (
            <div className="copilot-answer-footer">
              {usage && (
                <p className="copilot-usage text-xs" data-testid="answer-usage">
                  {formatUsage(usage)}
                </p>
              )}
              <AnswerActions
                content={message.content}
                question={question}
                answerRef={answerRef}
                meta={[
                  `Asked by ${askedBy} · ${new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`,
                  ...(usage ? [formatUsage(usage)] : []),
                ]}
              />
            </div>
          )}
        </div>
      </div>
    );
  };
}
