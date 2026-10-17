"use client";

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
      agentName="Asset Intelligence"
      theme={{
        mode,
        lightTheme: {
          background: "var(--copilot-background)",
          foreground: "var(--copilot-surface)",
          invertedBackground: "var(--copilot-accent)",
          textBrand: "var(--copilot-accent)",
          borderInteractiveEmphasis: "var(--copilot-accent)",
          chatUserResponseBg: "var(--copilot-accent-soft)",
          chatUserResponseText: "var(--openui-text-neutral-primary)",
        },
      }}
      starterVariant="card"
      starters={starterQuestions(role)}
    >
      <AgentInterface.SidebarHeader
        agentName={<span className="openui-agent-sidebar-header__agent-name">Conversations</span>}
      />
      <AgentInterface.SidebarFooter>
        <p className="copilot-sidebar-note">Your fleet. A clearer picture.</p>
      </AgentInterface.SidebarFooter>
      <AgentInterface.MobileHeader
        agentName={<span className="openui-agent-mobile-header-agent-name">Conversations</span>}
      />
      <AgentInterface.Welcome
        title="Your fleet, in focus."
        description="Ask about your wells, inspections, and maintenance. Get clear answers with the records to back them up."
        image={<span className="copilot-eyebrow">Asset intelligence workspace</span>}
      />
      <AgentInterface.Composer placeholder="Ask about your fleet…" />
    </AgentInterface>
  );
}

/** What shows instead of the chat: a load failure, an empty user list, or the prompt to pick who you are. */
function Notice({ loadError, loading }: { loadError?: string; loading: boolean }) {
  if (loadError) {
    return (
      <div role="alert" className="copilot-state copilot-state--error">
        <h2>Couldn&apos;t load the copilot</h2>
        <p>{loadError}</p>
        <p>Check that the data is loaded (run <code>pnpm load</code>) and the server is running, then refresh.</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="copilot-state" role="status">
        <span className="copilot-eyebrow">Asset intelligence workspace</span>
        <h2>Getting your workspace ready</h2>
        <p>Loading your profiles and available models…</p>
      </div>
    );
  }
  return (
    <div className="copilot-state">
      <span className="copilot-eyebrow">Welcome to your workspace</span>
      <h2>A clearer view of your fleet.</h2>
      <p>Choose your profile above to start exploring wells, inspections, and maintenance with questions in plain English.</p>
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
    <div className="copilot-app flex h-dvh w-full flex-col overflow-hidden">
      <header className="copilot-header">
        <div className="copilot-brand">
          <svg className="copilot-brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M7 23V14M16 23V9M25 23V5M5 27h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <h1>Asset Intelligence</h1>
            <p>Fleet operations copilot</p>
          </div>
        </div>
        <div className="copilot-controls">
          <label className="copilot-field">
            <span>Model for new chats</span>
            <select
              aria-label="Model for new chats"
              className="copilot-select"
              value={modelId}
              disabled={!catalog}
              onChange={(e) => setModelId(e.target.value)}
            >
              {catalog?.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="copilot-field copilot-field--profile">
            <span>Your profile</span>
            <select
              aria-label="Your profile"
              className="copilot-select"
              value={userId}
              onChange={(e) => pick(e.target.value)}
            >
              <option value="" disabled>
                Choose your profile…
              </option>
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.name} · {roleLabel(u.role)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Link href="/evals" className="copilot-link">
          Evaluations <span aria-hidden="true">→</span>
        </Link>
      </header>
      <main className="copilot-main min-h-0 flex-1">
        {userId && modelId ? (
          <Chat key={userId} userId={userId} role={users.find((u) => u.userId === userId)?.role ?? ""} modelId={modelId} />
        ) : (
          <Notice loadError={loadError} loading={users.length === 0 || !modelId} />
        )}
      </main>
    </div>
  );
}
