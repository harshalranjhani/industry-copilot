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
import { usageAssistantMessage } from "./assistant-message";
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
function Chat({ userId, modelId }: { userId: string; modelId: string }) {
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
      components={{ AssistantMessage }}
      agentName="Asset Intelligence Copilot"
      theme={{ mode }}
      starterVariant="short"
      starters={[
        {
          displayText: "Is WELL-0001 producing?",
          prompt: "Is WELL-0001 producing oil right now? When was it last inspected, and by whom?",
        },
        { displayText: "What can you do?", prompt: "What can you help me with?" },
      ]}
    />
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
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-black/10 px-4 py-2 dark:border-white/15">
        <span className="text-sm font-semibold">Asset Intelligence Copilot</span>
        <div className="flex items-center gap-4">
          <Link href="/evals" className="text-sm underline">
            Evals
          </Link>
          <label className="flex items-center gap-2 text-sm">
            <span className="opacity-70">New chats use</span>
            <select
              aria-label="Model for new conversations"
              className="rounded-md border border-black/20 bg-transparent px-2 py-1 dark:border-white/25"
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
            <span className="opacity-70">You are</span>
            <select
              aria-label="Who are you?"
              className="rounded-md border border-black/20 bg-transparent px-2 py-1 dark:border-white/25"
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
          <Chat key={userId} userId={userId} modelId={modelId} />
        ) : (
          <p className="p-6 text-sm opacity-70">{loadError ?? "Pick who you are to start. Your conversations are private to you."}</p>
        )}
      </main>
    </div>
  );
}
