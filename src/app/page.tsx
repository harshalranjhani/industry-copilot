"use client";

import "@openuidev/react-ui/styles/index.css";

import { fetchLLM, openAIMessageFormat, restStorage } from "@openuidev/react-headless";
import { AgentInterface, useSystemThemeMode } from "@openuidev/react-ui";
import { useEffect, useMemo, useState } from "react";
import { USER_HEADER } from "@/lib/conversations/identity";
import { copilotStreamAdapter } from "@/lib/chat/stream-adapter";
import { copilotLibrary } from "@/lib/openui/library";

interface FleetUser {
  userId: string;
  name: string;
  role: string;
  teamName: string | null;
}

const SELECTED_USER_KEY = "copilot:user";
const roleLabel = (role: string) => role.replaceAll("_", " ");

/** The chat for one user: every request carries their ID, so the sidebar and the memory are theirs alone. */
function Chat({ userId }: { userId: string }) {
  const mode = useSystemThemeMode();
  const { llm, storage } = useMemo(() => {
    const headers = { [USER_HEADER]: userId };
    return {
      // fetchLLM POSTs { threadId, messages }; the route keeps one Pi agent per user and threadId.
      llm: fetchLLM({
        url: "/api/chat",
        streamAdapter: copilotStreamAdapter(),
        messageFormat: openAIMessageFormat,
        headers,
      }),
      storage: restStorage({ baseUrl: "/api/threads", headers }),
    };
  }, [userId]);

  return (
    <AgentInterface
      llm={llm}
      storage={storage}
      componentLibrary={copilotLibrary}
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

  const pick = (id: string) => {
    setUserId(id);
    localStorage.setItem(SELECTED_USER_KEY, id);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-black/10 px-4 py-2 dark:border-white/15">
        <span className="text-sm font-semibold">Asset Intelligence Copilot</span>
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
      </header>
      <main className="min-h-0 flex-1">
        {userId ? (
          <Chat key={userId} userId={userId} />
        ) : (
          <p className="p-6 text-sm opacity-70">{loadError ?? "Pick who you are to start. Your conversations are private to you."}</p>
        )}
      </main>
    </div>
  );
}
