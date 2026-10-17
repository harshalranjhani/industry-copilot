import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readDataConfig } from "@/lib/data/config";
import type { StoredDocument, StoredRule } from "@/lib/data/fleet";
import { openFleet } from "@/lib/data/fleet";

// Written by `pnpm generate` (runs before dev and build) from src/library.ts.
const OPENUI_PROMPT_PATH = join(process.cwd(), "src/generated/openui-prompt.txt");
const GLOSSARY_PATH = join(process.cwd(), "GLOSSARY.md");

/** Until the user picker exists, nobody is identified. */
const USER_IDENTITY_PLACEHOLDER = "Not identified yet (the user picker is not available).";

export interface PromptParts {
  openUiPrompt: string;
  glossary: string;
  asOf: string;
  rules: StoredRule[];
  documents: StoredDocument[];
  userIdentity?: string;
}

const ANSWER_RULES = `## How to answer

- Always cite: every answer ends with a Sources block listing each inspection, record and document section (document ID and section number) you used.
- Never invent a cause. Give a reason for a stop only from what your tools returned; if nothing explains it, say so plainly and suggest a check.
- Judge producing status only from the tool's delta against the well type's threshold, never from absolute wellhead temperature, and never from the recorded status.
- When the recorded status disagrees with the latest inspection, say the recorded status is out of date.
- Refer to areas, teams and people by name, and to wells by ID.
- Show the visual the user names; otherwise pick the one that fits (a Card for one well).`;

function rulesSummary(rules: StoredRule[]): string {
  return rules
    .map((r) => `- ${r.wellType} ${r.key} = ${r.value} ${r.unit} (${r.document} §${r.section})`)
    .join("\n");
}

/** Assembles the copilot's system prompt from its parts. */
export function composeSystemPrompt(parts: PromptParts): string {
  const documents = parts.documents
    .map((d) => `### ${d.documentId} (${d.kind}, ${d.path})\n\n${d.text}`)
    .join("\n\n---\n\n");
  return [
    parts.openUiPrompt,
    `## Who you are talking to\n\n${parts.userIdentity ?? USER_IDENTITY_PLACEHOLDER}`,
    `## Dates\n\nToday (AS_OF) is ${parts.asOf}. "Right now" always means each well's latest inspection, not today's date. Say when that inspection was.`,
    `## Domain glossary\n\n${parts.glossary}`,
    `## Parsed rules\n\nThese were read from the manuals and SOPs. Cite the document and section.\n\n${rulesSummary(parts.rules)}`,
    ANSWER_RULES,
    `## Manuals and SOPs (full text)\n\n${documents}`,
  ].join("\n\n");
}

/** The production prompt: the loaded data store's rules and documents plus the generated OpenUI prompt. */
export function buildSystemPrompt(): string {
  const fleet = openFleet(readDataConfig().dbPath);
  try {
    return composeSystemPrompt({
      openUiPrompt: readFileSync(OPENUI_PROMPT_PATH, "utf-8"),
      glossary: readFileSync(GLOSSARY_PATH, "utf-8"),
      asOf: readDataConfig().asOf,
      rules: fleet.rules(),
      documents: fleet.documents(),
    });
  } finally {
    fleet.close();
  }
}
