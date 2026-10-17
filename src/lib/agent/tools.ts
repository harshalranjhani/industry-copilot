import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";

const PingParams = Type.Object({
  message: Type.Optional(Type.String({ description: "Text to echo back" })),
});

/** Placeholder domain tool so the tool trace can be shown before the fleet tools exist. */
const pingTool: AgentTool<typeof PingParams> = {
  name: "ping",
  label: "Ping",
  description: "Health check. Echoes the given message back with the server time.",
  parameters: PingParams,
  execute: async (_toolCallId, params) => {
    const reply = `pong${params.message ? `: ${params.message}` : ""} (server time ${new Date().toISOString()})`;
    return { content: [{ type: "text", text: reply }], details: undefined };
  },
};

/** The agent's whole toolset: domain tools only, never shell, file or edit tools. */
export const copilotTools: AgentTool<any>[] = [pingTool];
