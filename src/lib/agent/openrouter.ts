import "server-only";
import { createModels } from "@earendil-works/pi-ai";
import { openrouterProvider } from "@earendil-works/pi-ai/providers/openrouter";
import type { ChatHandlerOptions } from "@/lib/chat/chat-handler";
import { readConfig } from "@/lib/config";
import { getRuntime } from "@/lib/runtime";
import { createCopilotTools } from "./tools";
import { composeSystemPrompt, loadStaticPromptParts } from "./system-prompt";

/** Production chat wiring: Pi on OpenRouter with the configured default model. */
export function openRouterChatOptions(): ChatHandlerOptions {
  const { openRouterApiKey, defaultModelId } = readConfig();
  const { fleet, conversations } = getRuntime();
  const promptParts = loadStaticPromptParts();
  const models = createModels();
  models.setProvider(openrouterProvider());
  const model = models.getModel("openrouter", defaultModelId);
  if (!model) throw new Error(`Model "${defaultModelId}" is not in Pi's OpenRouter catalog`);
  return {
    models,
    model,
    systemPrompt: ({ user, memory }) => composeSystemPrompt({ ...promptParts, user, memory }),
    tools: createCopilotTools(fleet),
    conversations,
    findUser: (userId) => fleet.findUser(userId),
    areaNames: fleet.areaNames(),
    getApiKey: (provider) => (provider === "openrouter" ? openRouterApiKey : undefined),
  };
}
