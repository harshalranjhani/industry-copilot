/** The request header that names the model a new conversation starts on. */
export const MODEL_HEADER = "x-copilot-model";

export interface ModelOption {
  /** The OpenRouter model ID. */
  id: string;
  name: string;
}

/** The models a conversation may use; the first is the built-in default. */
export const MODEL_ALLOWLIST: readonly ModelOption[] = [
  { id: "openai/gpt-6-luna", name: "GPT-6 Luna" },
  { id: "anthropic/claude-sonnet-5.5", name: "Claude Sonnet 5.5" },
  { id: "anthropic/claude-haiku-5.5", name: "Claude Haiku 5.5" },
  { id: "google/gemini-3.5-flash", name: "Gemini 3.5 Flash" },
  { id: "deepseek/deepseek-v4-pro", name: "DeepSeek V4 Pro" },
];

export interface ModelCatalog {
  models: readonly ModelOption[];
  /** The model a new conversation starts with. */
  defaultId: string;
}

export const isAllowedModel = (id: string): boolean => MODEL_ALLOWLIST.some((m) => m.id === id);

/**
 * The dropdown's contents. `configuredDefault` is the DEFAULT_MODEL setting;
 * a model outside the allowlist is a configuration error, not a silent fallback.
 */
export function modelCatalog(configuredDefault?: string): ModelCatalog {
  const configured = configuredDefault?.trim();
  if (configured && !isAllowedModel(configured)) {
    throw new Error(
      `DEFAULT_MODEL "${configured}" is not in the model allowlist: ${MODEL_ALLOWLIST.map((m) => m.id).join(", ")}`,
    );
  }
  return { models: MODEL_ALLOWLIST, defaultId: configured || MODEL_ALLOWLIST[0]!.id };
}
