# Industry Copilot — Asset Intelligence Copilot

Chat copilot for oil-field operators (FlytBase Hacktoberfest 2026 Hack Day). Ask plain-English questions about the well fleet and get cited answers with the right visual: a card, table, chart, map or heatmap. It is a Pi agent loop with OpenUI generative UI over the well dataset.

- Domain language: [GLOSSARY.md](GLOSSARY.md)
- Decisions: [docs/adr](docs/adr)
- Challenge docs: [PROBLEM_STATEMENT.md](PROBLEM_STATEMENT.md), [DATASET_GUIDE.md](DATASET_GUIDE.md), [EXAMPLE_QUESTIONS.md](EXAMPLE_QUESTIONS.md)

## Quick start

You need a recent Node, [pnpm](https://pnpm.io), and an [OpenRouter API key](https://openrouter.ai/keys) (the only LLM provider).

```bash
# 1. Get the code and the sample dataset (the dataset clone sits in the repo root, where it is git-ignored)
git clone <this repo> industry-copilot && cd industry-copilot
git clone https://github.com/FlytBaseAILabs/flytbase-ahc-swe-asset-intelligence-dataset

# 2. Install, configure, load, run
pnpm install
cp .env.example .env     # set OPENROUTER_API_KEY
pnpm load                # build the data store from the dataset
pnpm dev                 # http://localhost:3000
```

Open http://localhost:3000, pick who you are in the top bar (the starter questions follow your role), and ask. The model dropdown picks the model for **new** conversations; an existing conversation keeps its own. Each answer shows the tools it ran ("Querying fleet views", "Reading report MNT-0001-029"), its sources, and a footer with model, tokens, cost and latency. `/evals` shows the eval runs.

If the page says it could not load, run `pnpm load` and refresh. If an answer fails, the chat shows the reason (a bad key, an unavailable model, a tool error) instead of an empty reply.

## Configuration

Set these in `.env` (see [.env.example](.env.example)) or in the shell.

| Variable | Default | What it does |
|---|---|---|
| `OPENROUTER_API_KEY` | none, **required** | The key every model call uses. |
| `DATA_DIRS` | `flytbase-ahc-swe-asset-intelligence-dataset/sample-data` | Dataset roots, each holding `fleet/` and `assets/`. Separate several with `:` (`;` on Windows); a later root wins on ID collisions. |
| `AS_OF` | `2026-10-17` | "Today". Relative periods ("last 4 months") end on it and are compared by date. |
| `DEFAULT_MODEL` | `openai/gpt-6-luna` | The model a new conversation starts on; one of the five in the dropdown. |
| `DATA_DB`, `KNOWLEDGE_DB`, `CONVERSATIONS_DB` | `.data/copilot.db`, `.data/knowledge.db`, `.data/conversations.db` | Where the stores live. |

`DATA_DIRS` and `AS_OF` are read by `pnpm load` and by the running app, so after changing either run `pnpm load` again and restart `pnpm dev`.

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies. |
| `pnpm load` | Rebuild the data store (`.data/copilot.db`) from `DATA_DIRS`. Fails naming the document if a required rule can't be parsed from a manual. |
| `pnpm dev` | Run the app. First writes the system prompt OpenUI generates from the component library (`src/library.ts`) to `src/generated/`. |
| `pnpm build` / `pnpm start` | Production build and server. |
| `pnpm eval` | Replay the 18 example questions, grade them, write `evals/results.json` and `EVALS.md`. |
| `pnpm test` / `pnpm golden` / `pnpm typecheck` | Tests, the sample dataset's known answers, the type checker. |

`pnpm load` rebuilds only the dataset. Shared knowledge (corrections, notes, rule overrides) and every user's conversations live in their own files and **survive a reload**; delete `.data/knowledge.db` and `.data/conversations.db` for a clean slate.

## Runbook: the test dataset

The test dataset has the same format as the sample (more wells, more history) and is loaded **alongside** it, not instead of it.

1. Put it beside the sample: unpack or clone it to `test-data/` in the repo root (git-ignored). It must hold `fleet/` and `assets/` directly, like `sample-data/`.
2. Point `DATA_DIRS` at both roots, sample first, in `.env`:
   ```bash
   DATA_DIRS=flytbase-ahc-swe-asset-intelligence-dataset/sample-data:test-data
   ```
3. Reload and restart:
   ```bash
   pnpm load      # prints the counts per record type; check they grew
   pnpm dev
   ```
4. Run the final questions through the chat as the right users, or replay them as a scenario file: copy `evals/example-questions.json` to `evals/final-questions.json`, fill it in, and run `pnpm eval evals/final-questions.json`.

To use the test dataset alone, set `DATA_DIRS=test-data`. If it fails to load, the error names the document and rule at fault.

## Evals

`pnpm eval [scenario-file] [--model <id>] [--grader <id>]` replays a scenario file (default `evals/example-questions.json`) through the same chat route the UI uses, as the right users in new or continued chats, on its own copy of the knowledge store reset to dataset-only (the app's `.data` files are untouched). A grader model (default `anthropic/claude-sonnet-5.5`) judges each answer's facts, evidence and visual. `--model` runs the copilot on another allowlisted model. The final questions are just another scenario file in the same format.

## Layout

- `src/app` — the chat page, the `/evals` page and the API routes.
- `src/lib/agent` — the system prompt and the tools the model calls.
- `src/lib/data` — the dataset loader, the SQLite views and the shared knowledge store.
- `src/lib/chat` — the chat route, the stream the browser parses, starters and tool-trace labels.
- `src/lib/openui` — the component library: sources, map, heatmap on top of OpenUI's own.

License: MIT
