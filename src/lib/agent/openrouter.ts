import "server-only";
import { createModels } from "@earendil-works/pi-ai";
import { openrouterProvider } from "@earendil-works/pi-ai/providers/openrouter";
import type { ChatHandlerOptions } from "@/lib/chat/chat-handler";
import { readConfig } from "@/lib/config";
import { isAllowedModel } from "@/lib/models";
import { type CopilotRuntime, getRuntime } from "@/lib/runtime";
import { createCopilotTools } from "./tools";
import { composeSystemPrompt, loadStaticPromptParts } from "./system-prompt";

/** Production chat wiring: Pi on OpenRouter with the configured default model. The eval runner passes its own runtime. */
export function openRouterChatOptions(runtime: CopilotRuntime = getRuntime()): ChatHandlerOptions {
  const { openRouterApiKey, defaultModelId } = readConfig();
  const { fleet, conversations } = runtime;
  const promptParts = loadStaticPromptParts();
  const models = createModels();
  models.setProvider(openrouterProvider());
  // Fail at startup when an allowlisted model is missing from Pi's catalog, not mid-conversation.
  const modelFor = (modelId: string) => (isAllowedModel(modelId) ? models.getModel("openrouter", modelId) : undefined);
  if (!modelFor(defaultModelId)) throw new Error(`Model "${defaultModelId}" is not in Pi's OpenRouter catalog`);
  return {
    models,
    modelFor,
    defaultModelId,
    systemPrompt: ({ user, memory }) => composeSystemPrompt({ ...promptParts, user, memory }),
    tools: createCopilotTools(fleet),
    conversations,
    findUser: (userId) => fleet.findUser(userId),
    areaNames: fleet.areaNames(),
    getApiKey: (provider) => (provider === "openrouter" ? openRouterApiKey : undefined),
  };
}
