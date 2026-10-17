import "server-only";

const DEFAULT_MODEL_ID = "openai/gpt-6-luna";

export interface CopilotConfig {
  openRouterApiKey: string;
  defaultModelId: string;
}

/** The model a new conversation starts with (DEFAULT_MODEL, else the built-in default). */
export function readDefaultModelId(): string {
  return process.env.DEFAULT_MODEL?.trim() || DEFAULT_MODEL_ID;
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
