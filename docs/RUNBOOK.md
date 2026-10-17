# Submission runbook

The [two-page write-up](../output/pdf/industry-copilot-writeup.pdf) is the submission-length artifact. The [full answers PDF](../output/pdf/industry-copilot-submission.pdf) and [Markdown answers](../output/answers/final-answers.md) preserve all 11 questions / 21 turns without grading. The editable write-up is [WRITEUP.md](WRITEUP.md). The full answers include known limitations and should not be presented as verified reference answers.

## Current handoff

- Public MIT repository and final-answer artifacts are prepared.
- Final-question capture is complete on GPT-6 Luna; do not rerun paid evals merely to package the submission.
- Submit the two-page write-up; the 31-page PDF is supplementary material.
- Record and upload the required video (at most five minutes), then submit the write-up, video and repository link through OrganizerHQ. No video or portal submission has been completed by this agent.
- The checklist below is the original operational runbook. Final scenarios and saved answers already exist; do not overwrite them with the sample scenario.


## Final two hours

Run from the repo root. Check the box at each checkpoint before moving on.

**Before the dataset arrives (do this now)**
- [ ] `pnpm install && pnpm typecheck && pnpm test` pass; `.env` holds a working `OPENROUTER_API_KEY`.
- [ ] `pnpm load && pnpm dev`: ask one sample question in the UI, then stop the server.
- [ ] `pnpm eval` runs and writes `EVALS.md` (allow several minutes). Keep this run as the sample baseline.

**1. Load the test dataset (target: 15 minutes)**
- [ ] Unpack it to `test-data/` in the repo root. It must hold `fleet/` and `assets/` directly.
- [ ] Set in `.env`: `DATA_DIRS=flytbase-ahc-swe-asset-intelligence-dataset/sample-data:test-data`
- [ ] `pnpm load`. **Checkpoint:** the printed counts of wells, inspections, repairs and reports grew compared with the sample. If it fails, the error names the document and the rule at fault; fix the parser, not the data.
- [ ] `pnpm golden`. **Checkpoint:** the sample-data checks still pass (they read the sample root only).
- [ ] `pnpm dev`. Open `/`, pick a user, ask "How many wells are there per area?" and compare it with the printed counts.

**2. Add the final-questions scenario (target: 15 minutes)**
- [ ] Use the existing `evals/final-questions.json`; do not overwrite the completed scenario.
- [ ] Validate the supplied question file and the scenario match: 11 numbered questions, 21 turns, with the specified user and session sequence.
- [ ] Keep user, chat and order exactly as the organisers state them (memory questions depend on it).

**3. Run the evals (target: 30 minutes)**
- [ ] `pnpm eval evals/final-questions.json`. **Checkpoint:** every step has an answer and a cost; open `/evals` and read the failures.
- [ ] If one model looks weak, rerun with `pnpm eval evals/final-questions.json --model anthropic/claude-sonnet-5.5`. Compare cost and pass count.
- [ ] Fix only real bugs (tool errors, load failures, wrong view logic). Do not tune prompts to specific questions.

**4. Record the answers (target: 30 minutes)**
- [ ] For each question, copy the answer text and the visual from `/evals`, and note whether it was right.
- [ ] Keep the full answers in Markdown and raw JSON; historical grades remain separate from the ungraded final capture.
- [ ] When preparing the final full submission, add the final-question results page with "what worked" and "what didn't, and why"; update the model/cost details from that run.
- [ ] Use `output/pdf/industry-copilot-writeup.pdf` for the two-page write-up. Keep `output/pdf/industry-copilot-submission.pdf` as the full-answer companion.

**5. Submit (leave 20 minutes)**
- [ ] Both pages are at most one page each; cut the weakest sentences first.
- [ ] The repository is public with the MIT `LICENSE`; no `.env`, no dataset clone, no `.data/` committed.
- [ ] Video recorded and uploaded. Links, write-up and repository submitted on OrganizerHQ.

---

## Video outline (5 minutes at most, in your own voice)

| Time | Show | Say |
|---|---|---|
| 0:00 to 0:30 | The problem in one line, then the architecture diagram | An operator's question is spread over inspections, repairs, reports and notes. I built the agent layer in the middle. |
| 0:30 to 1:45 | Diagram, then the repo layout | The data is stored in three SQLite files (rebuildable data, shared knowledge, private conversations). Rules are parsed from the manuals. Numbers come from SQL views, so the model does no arithmetic. The tools are `query`, `well_snapshot`, the report tools and memory tools. |
| 1:45 to 3:45 | **One use case, live in the UI** (below) | Narrate each step as it happens. |
| 3:45 to 4:30 | `/evals` page | 18 sample questions replayed and graded. The honest result, and the cost per question. What the misses have in common. |
| 4:30 to 5:00 | Terminal or README | What I would do next, and one thing I learned. |

**The live use case (Q13 then Q15, the correction that ripples).** Pick Michael Turner and say, "The AI estimated the 24 Sep spill at WELL-0151 as 4.5 bbl. The field crew measured 5.4 bbl." Show the tool trace, the recorded correction with before and after (the spill becomes reportable and SR-01 becomes overdue) and the sources. Switch to Laura Simmons and ask, "Which spills in Northeast Block 8 in the last 90 days needed a report to the regulator?" She sees WELL-0151 at 5.4 bbl, with the correction attributed to Michael Turner. Finish with Jessica Reed asking about "the wells we discussed yesterday" to show that private memory stays private.

**Before recording:** use fresh demo store paths in the same terminal, then do one dry run. This keeps existing shared knowledge and private history intact.

```bash
export KNOWLEDGE_DB=.data/demo/knowledge.db
export CONVERSATIONS_DB=.data/demo/conversations.db
pnpm load
pnpm dev
```

## Configuration reference

Set these in `.env` (see [.env.example](../.env.example)) or in the shell.

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
| `pnpm eval` | Replay the 18 example questions, grade them, write `evals/results.json` and `EVALS.md`, and preserve a copy in `evals/history/`. |
| `pnpm test` / `pnpm golden` / `pnpm typecheck` | Tests, the sample dataset's known answers, the type checker. |

`pnpm load` rebuilds only the dataset. Shared knowledge (corrections, notes, rule overrides) and every user's conversations live in their own files and **survive a reload**. For a clean demo, use the separate store paths above.

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
4. Run the final questions through the chat as the right users, or replay them as a scenario file: use the existing `evals/final-questions.json` and run `pnpm eval evals/final-questions.json`.

To use the test dataset alone, set `DATA_DIRS=test-data`. If it fails to load, the error names the document and rule at fault.

## Evals

`pnpm eval [scenario-file] [--model <id>] [--grader <id>] [--results <file>] [--report <file>] [--workdir <dir>]` replays a scenario through the same chat route the UI uses, as the right users in new or continued chats. It uses separate knowledge and conversation stores, reset to dataset-only; the app's stores are untouched. The grader (default `anthropic/claude-sonnet-5.5`) judges facts, evidence and visuals. Saved runs appear in `/evals`, including history and step-by-step comparisons. Use separate `--workdir` paths for concurrent runs.

The default [example scenario](../evals/example-questions.json) has 27 turns across 18 questions. The [complex scenario](../evals/complex-questions.json) has 19 turns covering private preferences, custom plots/maps, follow-up restyling, cross-user corrections, scoped overrides and ordered recall. To keep its outputs separate:

```bash
pnpm eval evals/complex-questions.json --results evals/complex-results.json --report evals/complex-results.md --workdir .data/eval-complex
```

Every run also keeps a copy in `evals/history/`. The final questions use the same scenario format.


## Validation notes

The final preparation passed all 194 tests, typecheck and the production build. Local production smoke checks returned HTTP 200 for `/`, `/api/models`, `/api/users` and `/evals`. Next reports broad filesystem-tracing warnings for configurable SQLite paths; the build succeeds, but deployment packaging should scope or exclude those paths before deploying. No deployment was performed.

Historical runs include failures caused by an exhausted API-key allowance (HTTP 403). Those failures are infrastructure failures, not model-quality measurements. The final answer capture used a working replacement key and no grader. API keys, databases, process IDs and local logs are not versioned.
