# Industry Copilot — Asset Intelligence Copilot

Chat copilot for oil-field operators (FlytBase Hacktoberfest 2026 Hack Day). Pi agent loop + OpenUI generative UI over the well dataset.

- Domain language: [GLOSSARY.md](GLOSSARY.md)
- Decisions: [docs/adr](docs/adr)
- Challenge docs: [PROBLEM_STATEMENT.md](PROBLEM_STATEMENT.md), [DATASET_GUIDE.md](DATASET_GUIDE.md), [EXAMPLE_QUESTIONS.md](EXAMPLE_QUESTIONS.md)

## Run

```bash
pnpm install
cp .env.example .env   # set OPENROUTER_API_KEY
pnpm load              # build the data store from DATA_DIRS (default: the sample clone)
pnpm dev               # http://localhost:3000
pnpm eval              # replay the 18 example questions, grade them, write evals/results.json and EVALS.md
```

`pnpm dev` and `pnpm build` first run `pnpm generate`, which writes the system prompt OpenUI generates from the component library (`src/library.ts`) to `src/generated/`. `pnpm load` rebuilds the SQLite data store (`.data/copilot.db`) from the dataset roots in `DATA_DIRS` (path-separated, later roots win on ID collisions) and fails naming the document if a required rule can't be parsed from a manual. `pnpm golden` checks the sample dataset's known answers. `pnpm test` runs the tests, `pnpm typecheck` the type checker.

Dataset: clone https://github.com/FlytBaseAILabs/flytbase-ahc-swe-asset-intelligence-dataset beside this repo's code and point `DATA_DIRS` at its `sample-data/` (or leave it unset to use the clone in the repo root). `AS_OF` sets today (default 2026-10-17).  

`pnpm eval [scenario-file] [--model <id>] [--grader <id>]` replays a scenario file (default `evals/example-questions.json`) through the same chat route the UI uses, as the right users in new or continued chats, on its own copy of the knowledge store reset to dataset-only (the app's `.data` files are untouched). A grader model (default `anthropic/claude-sonnet-5.5`) judges each answer's facts, evidence and visual. `--model` runs the copilot on another allowlisted model. The final questions are just another scenario file in the same format: copy `evals/example-questions.json` and pass its path.

License: MIT
