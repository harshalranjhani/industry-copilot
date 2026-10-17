# Submission write-up (draft)

Two pages for OrganizerHQ, then the runbook for the final two hours and the video outline. Only pages 1 and 2 are submitted; copy each into the portal's format and keep each to one page. Sources for page 1: `.scratch/asset-copilot/SPEC.md`, `GLOSSARY.md`, `docs/adr/0001-corrections-as-overlay.md`. The diagram is `docs/architecture/industry-copilot-system-design.png`.

---

## Page 1: System design

**Asset Intelligence Copilot.** A Next.js chat app: a Pi agent loop (`pi-agent-core`) calls models through OpenRouter and answers in OpenUI Lang, rendered as cards, tables, charts, a map or a heatmap, plus a `Sources` block.

**Storage, indexing, retrieval.** Three SQLite files with different lifetimes:
- *Data store* (rebuilt by `pnpm load`): wells, inspections, repairs, regulator events, users, parsed rules, report text with an FTS5 index, and every manual and SOP in full. Loading several dataset roots upserts by ID, so a test set that adds wells or extends old ones both work.
- *Knowledge store* (durable): notes, corrections, claims and rule overrides.
- *Conversation store* (durable): each user's transcript, usage and a digest.

No embeddings: the manuals go into the prompt whole and reports are searched with full text. Prose-only facts (containment hours, each row of a report's compliance table) are extracted at load time. Rules (producing threshold, spill classes, SR-01 to SR-03, RC-01/02/04, RCA count) are parsed from the manuals and SOPs, each with its document and section, and a load fails by naming the document if a required rule can't be parsed. Nothing is hard-coded per well type, so a new type works.

**Numbers come from views, not from the model.** "Producing", effective spill volume, spill class, downtime (7 days per non-producing inspection), SR-01/02/03 compliance and RCA candidates are SQL views. The model writes `SELECT`s over them and never does arithmetic.

**Tools** (no shell or file access): `query` (read-only SQL on the views, row-capped), `well_snapshot`, `read_report`, `search_reports`, `record_knowledge`, `recall_my_conversations`.

**Combining numbers, documents and notes.** The prompt holds the user's identity, `AS_OF`, the glossary, the view documentation, the full manuals and SOPs, a summary of the parsed rules and the user's memory digest. A typical answer queries a view for the numbers, reads a report or notes for the cause, and cites each record or document section used. Where nothing explains a stop, it says no reason is recorded.

**Memory.**
- *Shared:* `record_knowledge` stores what a user says, scoped to one inspection field, one well or one well type, with the original value, author and reason. Corrections, claims and rule overrides apply to every later answer for every user, at exactly that scope. The overlay is applied in the views and never written into source data (ADR 0001), so reloading data cannot erase what users taught.
- *Private:* the conversation store is read only by user ID. After each answer a digest records the question, the wells and the records named. A new conversation starts with that user's recent digests, so "the wells we discussed yesterday" resolves to their own history.

**Conflicts.** `record_knowledge` returns the effect (before and after) and the conflicts. A claim the latest inspection contradicts is stored as `unconfirmed` and changes nothing. Notes that disagree about one inspection mark it `disputed`; both sides are shown and the detection stands without a formal correction.

**New data.** The loader reads fields, not file names, and finds reports through each repair's `report_file`. Eval scenarios are JSON, so the final questions need no code change.

**Models and cost.** Five models are switchable per new conversation: `openai/gpt-6-luna` (default), `anthropic/claude-sonnet-5.5`, `anthropic/claude-haiku-5.5`, `google/gemini-3.5-flash`, `deepseek/deepseek-v4-pro`. On the 18 sample questions (27 chat turns) with Luna, the answers cost $0.10 in total: about $0.0056 per question and 7 to 28 s per turn, median 10 s. Each turn reads about 78k input tokens (mostly the manuals) and writes about 600; every answer shows its cost and latency. Cost for the other models: *to fill from `pnpm eval --model`*.

**Next.** Make answers complete (the sample misses are mostly omitted supporting facts, not wrong numbers); make recall report a partial match (one well, not three) instead of answering from it; cache the static prompt prefix; compare models; add retrieval only if the manuals outgrow the prompt; let users edit or retire knowledge; add authentication.

---

## Page 2: Results

> Template. Today it holds the 18 sample questions (`EVALS.md`, run 2026-10-17, copilot `openai/gpt-6-luna`, graded by `anthropic/claude-sonnet-5.5`). Replace with the final questions after the final run: one row per question from `EVALS.md`, the answer in one line, and the "what worked / what didn't" text.

**Run:** passed 5 of 18 questions (13 of 27 chat turns, 48%), judged strictly on every expected fact, the sources and the visual. $0.10 total. All 27 turns cited sources and used the right visual.

| Q | Question (short) | Result | Facts | Answer in one line / what was missed |
|---|---|---|---|---|
| 1 | WELL-0001 producing now? | pass | 6/6 | Not producing (3.2 °C above air, below T200 limit); Ryan Brooks, 15 Oct; planned shut-in note; recorded status stale |
| 2 | NE-08 not producing, table | fail | 4/6 | Right four wells; repair start dates missing |
| 3 | WELL-0001 13-week line chart | pass | 2/2 | 13 readings, non-producing weeks marked |
| 4 | Spills and volume | fail | 2/3 | Totals right; did not name the corrected INS-0001-0070 |
| 5 | 2025 downtime | fail | 1/3 | 21 days right; evidence for the three stops missing |
| 6 | NE-07 top downtime | fail | 3/5 | 49/42/42 right; window off by one day; fourth well omitted |
| 7 | NE-08 spills, map | fail | 1/5 | Four right wells on the map; dates and volumes missing |
| 8 | Area × month heatmap | pass | 5/5 | Totals 35/43/37/26 |
| 9 | WELL-0001 compliance | fail | 7/8 | SR-01/02/03 and RC-04 right; missed the planned shut-in note |
| 10 | SW-24 containment breaches | fail | 3/4 | WELL-0082 and WELL-0100; did not say times come from the repair reports |
| 11 | Repair costs (2 turns) | pass | 5/5 | 25,794 / 46,942 / 5,176 |
| 12 | Temperature correction (2 turns) | fail | 4/6 | Correction applied and WELL-0164 dropped; reason (faulty thermal gun) and the dropped well not stated |
| 13 | Volume correction to 5.4 bbl | pass | 5/5 | WELL-0151 reportable, SR-01 overdue, SR-03 due 23 Nov 2026 |
| 14 | NE-07 RCA and T350 override (3 turns) | fail | 7/8 | Override applied, WELL-0120 added; WELL-0102 not shown as excluded |
| 15 | Correction seen by other users (2 turns) | fail | 4/6 | Jessica Reed saw WELL-0164 as producing; Laura Simmons got WELL-0151 at 5.4 bbl and SR-01 overdue, but not that the volume was corrected |
| 16 | Shared note, then private memory (3 turns) | fail | 4/5 | WELL-0007 shut-in note reached the second user; for "the wells we discussed yesterday" it avoided Michael Turner's wells but **answered from her one earlier chat (WELL-0164) instead of saying there is no such three-well conversation** |
| 17 | Contradicted claim (3 turns) | fail | 6/7 | Stored as unconfirmed; planned-return note missing |
| 18 | Disputed inspection INS-0101-0197 | fail | 2/3 | Shown as disputed and still a spill; spill repair omitted |

### What worked
- **Deterministic views.** Q1, Q3, Q8, Q11 and Q13 pass outright, and the failing answers got their headline figures right (downtime 49/42/42, costs, spill totals); the misses are omitted detail, one period edge and one over-eager memory recall.
- **Scoped corrections.** The temperature and volume corrections change later answers at their scope (Q12, Q13), and another user sees them (Q15). The T350 override adds WELL-0120 and leaves T200 alone (Q14).
- **Conflicts shown, not resolved.** A contradicted claim was stored as unconfirmed (Q17), and a dispute was surfaced with both sides (Q18).
- **Private memory.** Michael Turner's wells did not leak into another user's "wells we discussed yesterday" answer (Q16).
- **Visual choice.** The visual matched the question in all 27 turns.

### What didn't, and why
- **Missing supporting facts (most misses: Q2, Q4, Q5, Q7, Q9, Q15).** The model answers the question and leaves out the evidence around it: dates, volumes, the planned-shutdown note. Fix: an answering rule that lists the supporting facts to include, and richer per-row columns in tables and maps.
- **Window edge (Q6).** The period was stated as 17 Jun to 17 Oct instead of 16 Jun to 16 Oct. Fix: a golden check that fixes where relative-period boundaries fall, and a stated convention in the prompt.
- **Over-eager recall (Q16.3).** Jessica Reed's only earlier chat (Q15.1) was about WELL-0164. The copilot treated it as "the three wells we discussed" and gave its repair cost; the expected answer is that no such conversation exists. `recall_my_conversations` already tells the model to say so when nothing matches; the gap is that a partial match (one well, not three) still counts. Fix: have the prompt compare the recalled wells with what the user asked for and report the mismatch.
- **Correction not explained (Q12).** The answer applied the correction without saying why the well was dropped. Fix: show the correction's author and reason whenever it changes a list.
- **Strict grading.** One missed fact fails a whole question, so 5 of 18 understates how many answers were substantively right (13 of 27 turns, 71 of 92 expected facts). The final questions will use the same grader.

---

## Runbook: the final two hours

Run from the repo root. Check the box at each checkpoint before moving on.

**Before the dataset arrives (do this now)**
- [ ] `pnpm install && pnpm typecheck && pnpm test` pass; `.env` holds a working `OPENROUTER_API_KEY`.
- [ ] `pnpm load && pnpm dev`: ask one sample question in the UI, then stop the server.
- [ ] `pnpm eval` runs and writes `EVALS.md` (about 5 minutes). Keep this run as the sample baseline.

**1. Load the test dataset (target: 15 minutes)**
- [ ] Unpack it to `test-data/` in the repo root. It must hold `fleet/` and `assets/` directly.
- [ ] Set in `.env`: `DATA_DIRS=flytbase-ahc-swe-asset-intelligence-dataset/sample-data:test-data`
- [ ] `pnpm load`. **Checkpoint:** the printed counts of wells, inspections, repairs and reports grew compared with the sample. If it fails, the error names the document and the rule at fault; fix the parser, not the data.
- [ ] `pnpm golden`. **Checkpoint:** the sample-data checks still pass (they read the sample root only).
- [ ] `pnpm dev`. Open `/`, pick a user, ask "How many wells are there per area?" and compare it with the printed counts.

**2. Add the final-questions scenario (target: 15 minutes)**
- [ ] `cp evals/example-questions.json evals/final-questions.json`
- [ ] Replace the steps: one per question, with `user`, `chat` (`new` or `continue`), `question`, `expectedFacts` and `expectedVisual`. Questions without published answers can use empty `expectedFacts`; the grader then scores sources and visual only.
- [ ] Keep user, chat and order exactly as the organisers state them (memory questions depend on it).

**3. Run the evals (target: 30 minutes)**
- [ ] `pnpm eval evals/final-questions.json`. **Checkpoint:** every step has an answer and a cost; open `/evals` and read the failures.
- [ ] If one model looks weak, rerun with `pnpm eval evals/final-questions.json --model anthropic/claude-sonnet-5.5`. Compare cost and pass count.
- [ ] Fix only real bugs (tool errors, load failures, wrong view logic). Do not tune prompts to specific questions.

**4. Record the answers (target: 30 minutes)**
- [ ] For each question, copy the answer text and the visual from `/evals`, and note whether it was right.
- [ ] Fill page 2: the table, then "what worked" and "what didn't, and why". Say plainly what was wrong.
- [ ] Update page 1's cost line with the real totals from `EVALS.md`.

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

**Before recording:** reset with `rm .data/knowledge.db .data/conversations.db`, run `pnpm load`, close other windows, and do one dry run.
