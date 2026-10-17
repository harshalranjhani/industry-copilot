import "server-only";
import { existsSync } from "node:fs";
import { readDataConfig } from "@/lib/data/config";
import { type Fleet, openFleet } from "@/lib/data/fleet";
import { type ConversationStore, openConversationStore } from "@/lib/conversations/store";

export interface CopilotRuntime {
  fleet: Fleet;
  conversations: ConversationStore;
}

// Shared by every route handler; kept on globalThis so dev-mode module reloads reuse the open files.
const globalRuntime = globalThis as typeof globalThis & { __copilotRuntime?: CopilotRuntime };

/** The loaded fleet and the durable conversation store. Fails when `pnpm load` has not run. */
export function getRuntime(): CopilotRuntime {
  if (!globalRuntime.__copilotRuntime) {
    const { dbPath, knowledgePath, conversationsPath, asOf } = readDataConfig();
    if (!existsSync(dbPath)) throw new Error(`No data store at ${dbPath}. Run \`pnpm load\` first.`);
    globalRuntime.__copilotRuntime = {
      fleet: openFleet(dbPath, { knowledgePath, asOf }),
      conversations: openConversationStore(conversationsPath),
    };
  }
  return globalRuntime.__copilotRuntime;
}
