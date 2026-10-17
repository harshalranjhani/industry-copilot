# Industry Copilot — Asset Intelligence Copilot

Chat copilot for oil-field operators (FlytBase Hacktoberfest 2026 Hack Day). Pi agent loop + OpenUI generative UI over the well dataset.

- Domain language: [GLOSSARY.md](GLOSSARY.md)
- Decisions: [docs/adr](docs/adr)
- Challenge docs: [PROBLEM_STATEMENT.md](PROBLEM_STATEMENT.md), [DATASET_GUIDE.md](DATASET_GUIDE.md), [EXAMPLE_QUESTIONS.md](EXAMPLE_QUESTIONS.md)

## Run

```bash
pnpm install
cp .env.example .env   # set OPENROUTER_API_KEY
pnpm dev               # http://localhost:3000
```

`pnpm dev` and `pnpm build` first run `pnpm generate`, which writes the system prompt OpenUI generates from the component library (`src/library.ts`) to `src/generated/`. `pnpm test` runs the tests, `pnpm typecheck` the type checker.

Dataset: clone https://github.com/FlytBaseAILabs/flytbase-ahc-swe-asset-intelligence-dataset beside this repo's code and point `DATA_DIRS` at its `sample-data/`.

License: MIT
