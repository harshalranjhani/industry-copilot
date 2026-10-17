import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Written by `pnpm generate` (runs before dev and build) from src/library.ts.
const OPENUI_PROMPT_PATH = join(process.cwd(), "src/generated/openui-prompt.txt");

/**
 * The system prompt OpenUI generates from the component library and the
 * copilot's prompt options (src/lib/openui/prompt-options.ts).
 */
export function buildSystemPrompt(): string {
  return readFileSync(OPENUI_PROMPT_PATH, "utf-8");
}
