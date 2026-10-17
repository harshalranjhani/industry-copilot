"use client";

import "@openuidev/react-ui/styles/index.css";

import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  useSystemThemeMode,
} from "@openuidev/react-ui";
import { copilotStreamAdapter } from "@/lib/chat/stream-adapter";
import { copilotLibrary } from "@/lib/openui/library";

// fetchLLM POSTs { threadId, messages }; the route keeps one Pi agent per threadId.
const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: copilotStreamAdapter(),
  messageFormat: openAIMessageFormat,
});

export default function Home() {
  const mode = useSystemThemeMode();
  return (
    <div className="h-screen w-screen overflow-hidden">
      <AgentInterface
        llm={llm}
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
    </div>
  );
}
