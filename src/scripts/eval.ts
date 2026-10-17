import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createModels } from "@earendil-works/pi-ai";
import { openrouterProvider } from "@earendil-works/pi-ai/providers/openrouter";
import { openRouterChatOptions } from "../lib/agent/openrouter";
import { createChatHandler } from "../lib/chat/chat-handler";
import { readConfig } from "../lib/config";
import { openConversationStore } from "../lib/conversations/store";
import { readDataConfig } from "../lib/data/config";
import { openFleet } from "../lib/data/fleet";
import { renderEvalsMarkdown } from "../lib/evals/report";
import { runEvals } from "../lib/evals/runner";
import { loadScenarios } from "../lib/evals/scenarios";
import { isAllowedModel } from "../lib/models";

// `pnpm eval [scenario-file] [--model <id>] [--grader <id>] [--results <file>] [--report <file>]`
// Replays the scenarios through the real copilot and writes a results file and EVALS.md.
// Run it with `--conditions react-server` (the package script does) so `server-only` imports load outside Next.

const GRADER_DEFAULT = "anthropic/claude-sonnet-5.5";

function parseArgs(argv: string[]) {
  const flags = new Map<string, string>();
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--")) {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} needs a value`);
      flags.set(arg.slice(2), value);
    } else positional.push(arg);
  }
  const unknown = [...flags.keys()].filter((f) => !["model", "grader", "results", "report"].includes(f));
  if (unknown.length) throw new Error(`Unknown option --${unknown[0]}`);
  return {
    scenarioPath: resolve(positional[0] ?? "evals/example-questions.json"),
    model: flags.get("model"),
    grader: flags.get("grader") ?? GRADER_DEFAULT,
    resultsPath: resolve(flags.get("results") ?? "evals/results.json"),
    reportPath: resolve(flags.get("report") ?? "EVALS.md"),
  };
}

async function main() {
  try {
    process.loadEnvFile(".env");
  } catch {
    // no .env: the environment must already hold the key
  }
  const args = parseArgs(process.argv.slice(2));
  for (const id of [args.model, args.grader]) {
    if (id && !isAllowedModel(id)) throw new Error(`"${id}" is not an allowlisted model`);
  }

  // The run works on its own copy of the knowledge store and its own conversations, so it never touches the app's.
  const data = readDataConfig();
  const evalDir = resolve(".data", "eval");
  mkdirSync(evalDir, { recursive: true });
  const knowledgePath = join(evalDir, "knowledge.db");
  const conversationsPath = join(evalDir, "conversations.db");
  if (!existsSync(data.dbPath)) throw new Error(`No data store at ${data.dbPath}. Run \`pnpm load\` first.`);
  if (!existsSync(data.knowledgePath)) throw new Error(`No knowledge store at ${data.knowledgePath}. Run \`pnpm load\` first.`);
  copyFileSync(data.knowledgePath, knowledgePath);

  const scenarios = loadScenarios(args.scenarioPath);
  const { openRouterApiKey, defaultModelId } = readConfig();
  const fleet = openFleet(data.dbPath, { knowledgePath, asOf: data.asOf });
  const models = createModels();
  models.setProvider(openrouterProvider());
  const grader = models.getModel("openrouter", args.grader);
  if (!grader) throw new Error(`Grader model ${args.grader} is not in Pi's OpenRouter catalog`);

  console.log(`${scenarios.name}: ${scenarios.steps.length} steps on ${args.model ?? defaultModelId}, graded by ${args.grader}`);
  const run = await runEvals({
    scenarios,
    model: args.model,
    defaultModelId,
    stores: { knowledgePath, conversationsPath },
    // Opened after the runner has reset the conversation file, with the same wiring the chat route uses.
    openChat: () => {
      const conversations = openConversationStore(conversationsPath);
      return { chat: createChatHandler(openRouterChatOptions({ fleet, conversations })), close: () => conversations.close() };
    },
    resolveUser: (name) => fleet.findUser(name)?.userId,
    grader: { models, model: grader, getApiKey: (provider) => (provider === "openrouter" ? openRouterApiKey : undefined) },
  });
  fleet.close();

  for (const path of [args.resultsPath, args.reportPath]) mkdirSync(dirname(path), { recursive: true });
  writeFileSync(args.resultsPath, `${JSON.stringify(run, null, 2)}\n`);
  writeFileSync(args.reportPath, `${renderEvalsMarkdown(run)}\n`);
  for (const r of run.steps) console.log(`${r.grade.pass ? "pass" : "FAIL"}  ${r.step.id}  ${r.grade.matchedFacts.length}/${r.step.expectedFacts.length} facts`);
  console.log(`Passed ${run.passed} of ${run.total}. Wrote ${args.resultsPath} and ${args.reportPath}`);
}

main().catch((err) => {
  console.error(`Eval run failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
