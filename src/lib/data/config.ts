import { delimiter, join, resolve } from "node:path";

/** The sample dataset clone, used when DATA_DIRS is not set. */
export const SAMPLE_DATA_DIR = resolve(
  process.cwd(),
  "flytbase-ahc-swe-asset-intelligence-dataset/sample-data",
);

export interface DataConfig {
  /** Dataset roots, each holding `fleet/` and `assets/`. Later roots win on ID collisions. */
  roots: string[];
  /** The "today" that relative periods end on. */
  asOf: string;
  dbPath: string;
  /** The durable knowledge store, kept apart from the data store so a reload never touches it (ADR 0001). */
  knowledgePath: string;
}

/** Reads dataset configuration from the environment (DATA_DIRS, AS_OF, DATA_DB). */
export function readDataConfig(env: NodeJS.ProcessEnv = process.env): DataConfig {
  const roots = (env.DATA_DIRS ?? "")
    .split(delimiter)
    .map((dir) => dir.trim())
    .filter(Boolean)
    .map((dir) => resolve(dir));
  return {
    roots: roots.length > 0 ? roots : [SAMPLE_DATA_DIR],
    asOf: env.AS_OF?.trim() || "2026-10-17",
    dbPath: resolve(env.DATA_DB?.trim() || join(".data", "copilot.db")),
    knowledgePath: resolve(env.KNOWLEDGE_DB?.trim() || join(".data", "knowledge.db")),
  };
}
