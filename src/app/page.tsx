"use client";

import "@openuidev/react-ui/styles/index.css";

import { fetchLLM, openAIMessageFormat, restStorage } from "@openuidev/react-headless";
import { AgentInterface, useSystemThemeMode } from "@openuidev/react-ui";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { USER_HEADER } from "@/lib/conversations/identity";
import { copilotStreamAdapter } from "@/lib/chat/stream-adapter";
import { liveUsage } from "@/lib/chat/usage";
import { type ModelCatalog, MODEL_HEADER } from "@/lib/models";
import { starterQuestions } from "@/lib/chat/starters";
import { usageAssistantMessage } from "./assistant-message";
import { CopilotToolTrace } from "./tool-trace";
import { copilotLibrary } from "@/lib/openui/library";

interface FleetUser {
  userId: string;
  name: string;
  role: string;
  teamName: string | null;
}

const SELECTED_USER_KEY = "copilot:user";
const roleLabel = (role: string) => role.replaceAll("_", " ");

/**
 * The chat for one user: every request carries their ID, so the sidebar and the memory are theirs alone.
 * It also carries the picked model, which only a new conversation takes: an existing one keeps its own.
 */
function Chat({ userId, role, modelId }: { userId: string; role: string; modelId: string }) {
  const mode = useSystemThemeMode();
  const { llm, storage, headers, AssistantMessage } = useMemo(() => {
    // Both adapters read this object on every request, so the model can change under a live chat.
    const headers: Record<string, string> = { [USER_HEADER]: userId };
    return {
      headers,
      // fetchLLM POSTs { threadId, messages }; the route keeps one Pi agent per user and threadId.
      llm: fetchLLM({
        url: "/api/chat",
        streamAdapter: copilotStreamAdapter(liveUsage.set),
        messageFormat: openAIMessageFormat,
        headers,
      }),
      storage: restStorage({ baseUrl: "/api/threads", headers }),
      AssistantMessage: usageAssistantMessage(headers),
    };
  }, [userId]);
  useEffect(() => {
    headers[MODEL_HEADER] = modelId;
  }, [headers, modelId]);

  return (
    <AgentInterface
      llm={llm}
      storage={storage}
      componentLibrary={copilotLibrary}
      components={{ AssistantMessage, ToolCallTimeline: CopilotToolTrace }}
      agentName="Asset Intelligence Copilot"
      theme={{ mode }}
      starterVariant="short"
      starters={starterQuestions(role)}
    />
  );
}

/** What shows instead of the chat: a load failure, an empty user list, or the prompt to pick who you are. */
function Notice({ loadError, users }: { loadError?: string; users: number }) {
  if (loadError) {
    return (
      <div role="alert" className="copilot-state copilot-state--error">
        <h2>Couldn&apos;t load the copilot</h2>
        <p>{loadError}</p>
        <p>Check that the data is loaded (run <code>pnpm load</code>) and the server is running, then refresh.</p>
      </div>
    );
  }
  if (users === 0) {
    return (
      <div className="copilot-state">
        <h2>Loading…</h2>
        <p>Fetching the people and models.</p>
      </div>
    );
  }
  return (
    <div className="copilot-state">
      <h2>Who are you?</h2>
      <p>Pick your name in the top bar to start. Your conversations are private to you.</p>
    </div>
  );
}

export default function Home() {
  const [users, setUsers] = useState<FleetUser[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [userId, setUserId] = useState<string>("");
  const [catalog, setCatalog] = useState<ModelCatalog>();
  const [modelId, setModelId] = useState<string>("");

  useEffect(() => {
    fetch("/api/users")
      .then(async (res) => {
        const body = (await res.json()) as { users?: FleetUser[]; error?: string };
        if (!res.ok || !body.users) throw new Error(body.error ?? `Could not load users (${res.status})`);
        setUsers(body.users);
        const saved = localStorage.getItem(SELECTED_USER_KEY);
        if (saved && body.users.some((u) => u.userId === saved)) setUserId(saved);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)));
  }, []);

  useEffect(() => {
    fetch("/api/models")
      .then(async (res) => {
        const body = (await res.json()) as Partial<ModelCatalog> & { error?: string };
        if (!res.ok || !body.models || !body.defaultId) throw new Error(body.error ?? `Could not load models (${res.status})`);
        const loaded = body as ModelCatalog;
        setCatalog(loaded);
        setModelId(loaded.defaultId);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)));
  }, []);

  const pick = (id: string) => {
    setUserId(id);
    localStorage.setItem(SELECTED_USER_KEY, id);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <header className="copilot-header">
        <span className="text-sm font-semibold">Asset Intelligence Copilot</span>
        <div className="flex items-center gap-4">
          <Link href="/evals" className="copilot-link">
            Evals
          </Link>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-(--openui-text-neutral-secondary)">New chats use</span>
            <select
              aria-label="Model for new conversations"
              className="copilot-select"
              value={modelId}
              disabled={!catalog}
              onChange={(e) => setModelId(e.target.value)}
            >
              {catalog?.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.id}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-(--openui-text-neutral-secondary)">You are</span>
            <select
              aria-label="Who are you?"
              className="copilot-select"
              value={userId}
              onChange={(e) => pick(e.target.value)}
            >
              <option value="" disabled>
                Pick who you are…
              </option>
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.name} · {roleLabel(u.role)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main className="min-h-0 flex-1">
        {userId && modelId ? (
          <Chat key={userId} userId={userId} role={users.find((u) => u.userId === userId)?.role ?? ""} modelId={modelId} />
        ) : (
          <Notice loadError={loadError} users={users.length} />
        )}
      </main>
    </div>
  );
}
