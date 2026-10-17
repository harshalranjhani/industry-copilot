/** The part of the shell's `ToolActivity` a label needs. */
export interface ToolActivityLike {
  toolName: string;
  status: "streaming" | "executing" | "complete" | "error";
  input: unknown;
}

const idArg = (input: unknown, key: string): string | undefined => {
  const value = input && typeof input === "object" ? (input as Record<string, unknown>)[key] : undefined;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const LABELS: Record<string, (input: unknown) => string> = {
  query: () => "Querying fleet views",
  well_snapshot: (input) => {
    const id = idArg(input, "asset_id");
    return id ? `Checking ${id}'s latest state` : "Checking a well's latest state";
  },
  read_report: (input) => {
    const id = idArg(input, "maintenance_id");
    return id ? `Reading report ${id}` : "Reading a repair report";
  },
  search_reports: () => "Searching repair reports",
  record_knowledge: () => "Saving what you told me",
  recall_my_conversations: () => "Recalling your earlier conversations",
  ping: () => "Checking the server",
};

/**
 * The friendly line the tool trace shows for a call, e.g. "Reading report MNT-0001-029".
 * Undefined for a tool without a label, so the shell words it itself.
 */
export function toolStatusMessage({ toolName, status, input }: ToolActivityLike): string | undefined {
  const label = LABELS[toolName]?.(input);
  if (!label) return undefined;
  return status === "error" ? `${label} failed` : label;
}
