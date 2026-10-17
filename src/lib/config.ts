import "server-only";

import { modelCatalog } from "@/lib/models";

export interface CopilotConfig {
  openRouterApiKey: string;
  defaultModelId: string;
}

/** The dropdown's models and the one a new conversation starts with (DEFAULT_MODEL, else the built-in default). */
export function readModelCatalog() {
  return modelCatalog(process.env.DEFAULT_MODEL);
}

export function readDefaultModelId(): string {
  return readModelCatalog().defaultId;
}

/** Reads server configuration from the environment (.env in dev). */
export function readConfig(): CopilotConfig {
  const env = process.env;
  const openRouterApiKey = env.OPENROUTER_API_KEY?.trim();
  if (!openRouterApiKey) {
    throw new Error("Missing OPENROUTER_API_KEY. Copy .env.example to .env and set it.");
  }
  return {
    openRouterApiKey,
    defaultModelId: readDefaultModelId(),
  };
}
