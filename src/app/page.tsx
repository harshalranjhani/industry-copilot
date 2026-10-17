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
          { displayText: "Ping the tools", prompt: "Ping the tools with the message 'hello' and show me the result." },
          { displayText: "What can you do?", prompt: "What can you help me with?" },
        ]}
      />
    </div>
  );
}
