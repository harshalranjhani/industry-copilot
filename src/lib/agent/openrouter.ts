import "server-only";
import { existsSync } from "node:fs";
import { createModels } from "@earendil-works/pi-ai";
import { openrouterProvider } from "@earendil-works/pi-ai/providers/openrouter";
import type { ChatHandlerOptions } from "@/lib/chat/chat-handler";
import { readConfig } from "@/lib/config";
import { readDataConfig } from "@/lib/data/config";
import { openFleet } from "@/lib/data/fleet";
import { createCopilotTools } from "./tools";
import { buildSystemPrompt } from "./system-prompt";

/** Production chat wiring: Pi on OpenRouter with the configured default model. */
export function openRouterChatOptions(): ChatHandlerOptions {
  const { openRouterApiKey, defaultModelId } = readConfig();
  const { dbPath } = readDataConfig();
  if (!existsSync(dbPath)) throw new Error(`No data store at ${dbPath}. Run \`pnpm load\` first.`);
  const models = createModels();
  models.setProvider(openrouterProvider());
  const model = models.getModel("openrouter", defaultModelId);
  if (!model) throw new Error(`Model "${defaultModelId}" is not in Pi's OpenRouter catalog`);
  return {
    models,
    model,
    systemPrompt: buildSystemPrompt(),
    tools: createCopilotTools(openFleet(dbPath)),
    getApiKey: (provider) => (provider === "openrouter" ? openRouterApiKey : undefined),
  };
}
