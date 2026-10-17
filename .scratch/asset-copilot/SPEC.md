---
title: Asset Intelligence Copilot — end-to-end MVP
labels: [ready-for-agent]
status: open
---

## Problem Statement

Operators, supervisors, inspectors and HSE officers on an oil field have to answer simple questions, such as "which wells in my area were down longest this summer, and why?", by digging through several systems. The information is spread across weekly inspection records, repair history, free-text repair reports, regulator events, human notes and long well-type manuals and SOPs. Producing status is never written down and has to be derived from temperatures using per-type rules. The recorded status goes stale. Spill detections get corrected later. Key facts such as containment time exist only inside repair reports. People's knowledge sits in their heads or in scattered notes that contradict each other.

As a result, a well that stopped producing or started leaking can go unnoticed for weeks, reporting deadlines slip, and fines follow. Nobody can ask a question in plain English and get a correct answer, with evidence, in seconds.

The challenge also requires the system to load an unseen test dataset in the same format during the final two hours, and to answer unseen questions correctly. A system tuned to the sample questions will fail.

## Solution

An Asset Intelligence Copilot. It's a chat assistant where a user picks who they are, asks a plain-English question, and gets an answer generated for that question with:

- a short, direct answer;
- the visual that fits: a status card for one well, a table for a list, a line chart over time, a bar chart to compare, a map for locations, a heatmap for two dimensions. If the user names a visual, it uses that one;
- a sources block citing every record and document section used.

The copilot's numbers come from deterministic, rule-aware views over the data, so it doesn't have to do arithmetic. The rules (producing thresholds, spill classes, deadlines, escalation counts) are read from the manuals and SOPs themselves.

The copilot learns from users:
- **Corrections** to raw data or to AI analysis are kept beside the original value, attributed, and applied in every later answer for every user, at exactly their scope: one inspection field, one well, or one well type.
- **Claims** that contradict the data are recorded as unconfirmed.
- **Disputes** between people are shown, not resolved silently.

Each user's conversations are private to them, and "what we discussed yesterday" resolves against that user's own history. A built-in evaluation harness replays the example scenarios, grades the answers and shows the results on an in-app evals page.

## User Stories

### Asking about the data
1. As a field operator, I want to ask whether a specific well is producing oil right now, so that I know its current state without reading raw temperatures.
2. As a field operator, I want "right now" to mean each well's latest inspection, so that answers reflect the most recent evidence rather than the calendar date.
3. As a field operator, I want to see when a well was last inspected, how, and by whom (by name), so that I can judge how fresh the evidence is.
4. As a production supervisor, I want the copilot to judge producing status from the wellhead-minus-ambient difference against the well type's threshold, so that a hot idle wellhead on a summer day is never mistaken for a producing one.
5. As a production supervisor, I want the copilot to point out when the recorded status disagrees with the latest inspection, so that I know the system of record is stale.
6. As a production supervisor, I want a list of all non-producing wells in an area with the reason for each, so that I can prioritise follow-up.
7. As a production supervisor, I want the copilot to give each stop's reason from open repairs, valid notes and inspector remarks, and to say plainly when nothing explains a stop and suggest a check, so that it never invents a cause.
8. As a production supervisor, I want a line chart of a well's wellhead and ambient temperature over a period with non-producing readings marked, so that I can see when and how it stopped.
9. As an HSE officer, I want to count a well's spills over a period and their total volume, listed in a table, so that I know its spill history.
10. As an HSE officer, I want detections that were corrected (e.g. rainwater, shadow, washout water) excluded from spill counts and totals, and the exclusion mentioned, so that statistics match the SOP.
11. As a production supervisor, I want a well's downtime for a period computed as seven days per non-producing inspection, with the contributing inspections and their causes, so that the number is defensible.
12. As a production supervisor, I want missed inspections to add no downtime, so that gaps in data don't inflate the figures.
13. As a production supervisor, I want to rank wells in an area by downtime over a period and see a bar chart, so that I can compare them at a glance.
14. As a production supervisor, I want relative periods such as "last 4 months" or "last 90 days" to end on the configured today and be compared by date, so that windows are consistent.
15. As an HSE officer, I want a map pinning every well in an area that had a real spill in a period, with date and volume, so that I can see where the problems are.
16. As an HSE officer, I want a heatmap of spills by area and month, with corrected detections removed, so that I can spot patterns in two dimensions.
17. As an HSE officer, I want to know which rules a well has breached in a period, with each breach's protocol, limit, actual value and evidence, so that I can act on non-compliance.
18. As an HSE officer, I want breaches separated from open actions whose deadlines haven't passed or whose work is under way, so that I don't over-report.
19. As an HSE officer, I want facts that exist only in repair reports, such as containment time and the report's compliance check, used in answers and cited to the report, so that nothing hidden in free text is missed.
20. As an HSE officer, I want spills that weren't contained within the SOP time limit found across an area, so that I can follow up on SR-02 breaches.
21. As a maintenance lead, I want to know which wells need a root-cause analysis on an equipment kind (corrective repairs within the last 12 months at or above the escalation count), so that RCAs happen on time.
22. As a maintenance lead, I want to know repair costs per well over a period, where a repair belongs to the period of its start date, so that I can track spend.
23. As a maintenance lead, I want open repairs (planned end after today) shown as still open, so that I know what work is in progress.
24. As any user, I want to refer to areas, teams and people by name, and to wells by ID, so that answers read naturally.
25. As any user, I want to name the visual I want ("show it as a table") and get it, so that I control the presentation.
26. As any user, I want every answer to end with a sources block listing the inspections, repairs, reports, regulator events, notes, knowledge entries and manual/SOP sections it used, so that I can verify it.
27. As any user, I want to ask questions nobody anticipated (new combinations of filters, periods and record types), so that the copilot is useful beyond a fixed menu.

### Feedback and shared knowledge
28. As a production supervisor, I want to correct a wrong raw reading ("the 15 Oct reading was wrong; re-measured at 41.0 °C"), so that answers use the right value.
29. As a production supervisor, I want the copilot to keep the original value and record who corrected it, when and why, so that the correction is auditable.
30. As a production supervisor, I want the copilot to tell me when my correction conflicts with other evidence on the same inspection (e.g. "Pump jack not moving.") and ask me to confirm, so that I don't overwrite reality by mistake.
31. As a production supervisor, I want to correct the AI's spill-volume estimate with a field measurement, keeping the AI's estimate for reference, so that classification uses the real volume.
32. As an HSE officer, I want a corrected spill volume to re-derive the spill class and every duty that follows (reporting deadline, cleanup verification due date, possible breaches), and to flag report statements based on the old estimate as no longer valid, so that compliance reflects the truth.
33. As a production supervisor, I want to set a team rule for a whole well type ("pump jack RCA after 2 repairs for T350"), so that the copilot applies our practice.
34. As a production supervisor, I want a well-type rule override applied only to wells of that type, and answers to say it follows my rule rather than the manual, so that scope is never exceeded.
35. As a field operator, I want to share a fact about a well with everyone ("WELL-0007 will be shut in from 17 Oct for 10 days"), so that colleagues asking later get that context.
36. As any user, I want corrections, notes and rule overrides made by others to apply to my answers, with attribution, so that knowledge is shared.
37. As any user, I want to see a visible "corrected by <name>" or "unconfirmed claim" marker wherever recorded knowledge changed or qualified an answer, so that I can tell data from what people taught the copilot.
38. As a field operator, I want the copilot to tell me when my statement contradicts the latest inspection, cite the inspection and any agreeing notes, record my statement as unconfirmed and ask for confirmation, so that conflicts are surfaced rather than silently resolved.
39. As any user, I want the copilot to show both sides when people's notes disagree about the same inspection, and to explain that neither is a formal correction, so that I can judge for myself.
40. As any user, I want the dataset's own notes and corrections treated as the same kind of knowledge as feedback given in chat, so that behaviour is consistent.
41. As an organizer loading a new dataset, I want everything users have taught the copilot to survive a data reload, so that learning isn't lost.

### Private memory and identity
42. As any user, I want to pick who I am from the fleet's user list without logging in, so that demos and evaluation can switch between people quickly.
43. As any user, I want my conversations listed and resumable, and visible only to me, so that my history stays private.
44. As a production supervisor, I want to start a new chat and refer to "the three wells we discussed yesterday", so that I can continue earlier analysis without repeating myself.
45. As any user, I want the copilot to say it has no such earlier conversation with me when I refer to one I never had, and never to use another user's history, so that private memory stays private.

### Product, models and evaluation
46. As any user, I want starter questions suited to my role, so that I can see what the copilot can do.
47. As any user, I want to see which tools the copilot called while answering, so that I trust how it got there.
48. As any user, I want answers to stream progressively, so that the copilot feels responsive.
49. As a builder, I want to switch between several models (default `openai/gpt-6-luna`, plus Claude Sonnet 5.5, Claude Haiku 5.5, Gemini 3.5 Flash, DeepSeek V4 Pro) from the header, so that I can compare quality and cost.
50. As a builder, I want each answer to record its model, token usage, cost and latency, so that the write-up can report real costs.
51. As a builder, I want to load one or more dataset folders (the sample plus the test set) with one command, merged by record ID, so that the test dataset can be loaded alongside the sample during the final two hours.
52. As a builder, I want "today" to be configurable, so that relative periods match the evaluation's reference date.
53. As a builder, I want the loader to fail loudly when a required rule can't be found in a manual or SOP, so that a silent wrong threshold never reaches an answer.
54. As a builder, I want a new well type that ships with its own manual to be picked up automatically, so that unseen data works.
55. As a builder, I want an eval runner that replays the scenario questions in order, as the right users and in fresh or continued chats as specified, against a fresh knowledge store, grading each answer's facts and visual, so that I can measure correctness end to end.
56. As a builder, I want to run the evals against any of the switchable models, so that I can compare them.
57. As a builder, I want eval results written to a Markdown report and shown on an in-app evals page (pass/fail, model, cost, latency, the facts that didn't match, and the rendered answer), so that I can debug failures and submit page 2 of the write-up.
58. As a builder, I want to add the final questions to the eval runner as a new scenario file and run them, so that recording the final answers is mechanical.
59. As a judge, I want to clone the public repo and run setup, load and dev with one command each, so that I can reproduce the demo.

## Implementation Decisions

**Stack and shape**
- One Next.js application with React 19, a TypeScript server side and pnpm. The frontend and chat route shape are adapted from OpenUI's official Pi harness example.
- The agent loop is `@earendil-works/pi-agent-core` 1.x (the `@mariozechner/*` packages are obsolete) with `typebox` tool schemas. It exposes only the domain tools below: no shell, file or edit tools. One Agent is created per conversation and is never shared across users.
- All LLM calls go through OpenRouter (`OPENROUTER_API_KEY`) using Pi's OpenRouter provider.
- The model allowlist is `openai/gpt-6-luna` (default), `anthropic/claude-sonnet-5.5`, `anthropic/claude-haiku-5.5`, `google/gemini-3.5-flash` and `deepseek/deepseek-v4-pro`. A conversation keeps the model it started with.
- Configuration: `DATA_DIRS` (one or more dataset roots, each containing `fleet/` and `assets/`), `AS_OF` (default `2026-10-17`), and the default model.

**Module: Dataset Loader** (deep module; interface: load the given roots, return a load summary or fail)
- Reads every `fleet/` and `assets/<well>/` file, upserting by primary ID across roots. Later roots win on ID collisions, so the merge is correct whether the test set adds wells or extends existing ones.
- Resolves repair reports only through each repair's `report_file` field; file names vary.
- Extracts report facts: containment hours (e.g. "contained about 7 hours after…") and every row of the report's compliance check table (protocol, result, detail). It also indexes the full report text for full-text search.
- Imports dataset notes as knowledge entries (see Knowledge Store). It pulls the inspection IDs named inside note text (e.g. "Inspection INS-0101-0197: …") so that feedback notes link to their inspection even without the `inspection_id` field.
- Rebuilds the data store from scratch on every load and never touches the knowledge store (ADR 0001).

**Module: Rules** (filled by the loader; read by the views and the agent)
- Rules parsed from the well-type manuals for each type: producing threshold (°C above ambient), temperature alarm limit, spill shut-in pad-area percentage, RCA corrective-repair count and window, and downtime escalation days. A type whose manual defers to another ("follows the T200 manual") inherits the missing rules from it.
- Rules parsed from the SOPs: spill class volume bounds, the SR-01 written-notice deadline (standard and major), the SR-02 containment limit, the SR-03 verification window, the RC-01 inspection interval, the RC-04 response window and the RC-02 cadence.
- Each rule stores its value, unit, and source document and section, so that it can be cited.
- A required rule that can't be parsed fails the load with a message naming the document.
- The full text of every manual and SOP is also given to the agent for qualitative reasoning.

**Module: Knowledge Store** (durable, separate from the data store; survives reloads)
- One entry kind covers dataset notes and chat-recorded knowledge alike. Entry shape:
  - kind: `note` | `correction` | `claim` | `rule_override`
  - scope: `inspection_field` (inspection ID + field) | `well` (well ID) | `well_type` (type + rule key)
  - value and original value (for corrections and overrides)
  - text, reason, author user, created at, valid from / valid to
  - status: `accepted` | `unconfirmed` | `disputed`
  - origin: `dataset` | `chat`
- Correctable inspection fields are `wellhead_temp_c`, `ambient_temp_c`, `spill_detected` and `spill_est_volume_bbl`. A dataset correction note means `spill_detected = false` for its inspection.
- Recording interface (used by the `record_knowledge` tool): validates the target exists, stores the entry, and returns the effect plus a list of **conflicts**. The effect shows before and after for derived values such as producing status, spill class and RCA membership. Conflicts are other notes or inspector remarks on the same target that disagree, or for claims, the latest inspection when it contradicts the claim. A claim contradicted by data is stored as `unconfirmed` and changes no derived value.
- When two or more non-correction notes reference the same inspection and disagree, the inspection is marked as disputed. Detections stand unless a formal correction exists.

**Module: Fleet Views** (the query layer every answer goes through; the highest test seam)
- These are read-only views over the data store with knowledge applied on top. Names may differ in code; the contract is:
  - Effective inspections: original and effective values per field; delta above ambient; producing flag using the type threshold; is-spill (detected and not corrected out); effective volume; spill class; and attribution of any correction applied.
  - Latest inspection per well, with recorded-status mismatch.
  - Downtime: seven days per non-producing effective inspection, filterable by period.
  - Spills: real spills only, with area, month, location and class.
  - Spill compliance per spill:
    - discovery time (inspection time);
    - reporting required (from the effective class), the deadline, the filed report from regulator events, and SR-01 status;
    - containment hours from the report and SR-02 status;
    - SR-03 verification due date and status;
    - a flag when a report's stated classification disagrees with the effective class.
  - Repairs with an open/closed state relative to `AS_OF`, a period by start date, and cost.
  - RCA candidates: corrective repairs per well and equipment kind within the 12 months before `AS_OF`, compared against the effective escalation count. The effective count is the manual's rule unless a `well_type` rule override exists for that type, and the view records which applied.
  - Notes valid at a date, and disputes.
- Every row carries the IDs needed for citation.

**Module: Copilot Agent**
- System prompt contents:
  - who the user is (name, role, team);
  - `AS_OF` and the "right now = latest inspection" convention;
  - the domain glossary;
  - documentation of the fleet views and their columns;
  - full manual and SOP text;
  - a summary of the parsed rules and any active rule overrides;
  - the private-memory digest for this user;
  - the OpenUI component-library prompt;
  - answering rules: cite everything, never invent a cause, surface conflicts, record user-stated facts via `record_knowledge` in the same turn, name people and areas by name.
- Tools:
  - `query` (read-only SQL over the fleet views only; row-capped);
  - `well_snapshot` (latest effective inspection, recorded status, open repairs, valid notes, knowledge, disputes);
  - `read_report` (by repair ID);
  - `search_reports` (full text);
  - `record_knowledge`;
  - `recall_my_conversations` (scoped to the current user).
- Tools with side effects run sequentially.
- The final message is pure OpenUI Lang: a root `Stack` containing the answer text, at most one primary visual, optional callouts or badges, and a `Sources` component. OpenUI Lang is never emitted in reasoning or tool arguments.
- Streaming: Pi events are mapped to OpenAI-style chat-completion chunks. Text deltas become content, and tool execution start/end becomes tool-call deltas, which the chat shell renders as the visible tool trace. Only the newest user message is sent into Pi; the server owns the transcript.

**Module: Conversation Store** (private memory)
- Stores per conversation: user, model, title, the full Pi message transcript (JSON), creation and update times, and per-answer usage (input and output tokens, cost, latency).
- After each answer it updates a digest entry: the question, the well, area and record IDs named in the answer, and a one-line summary.
- A new conversation's digest is that user's most recent conversations, newest first. "Yesterday" resolves to the user's previous conversations; days are not simulated.
- Every read is filtered by user ID. There is no cross-user access path.

**Module: Component Library** (OpenUI)
- OpenUI's built-in library (Card, Table, LineChart, BarChart, Callout, Tag, and others) extended with three custom components, defined once at module scope:
  - `GeoMap`: Leaflet with OpenStreetMap tiles; props are points with lat/lon, label, and optional detail and value.
  - `Heatmap`: wraps OpenUI's heatmap primitive; props are row labels, column labels and a value matrix, with optional row and column totals.
  - `Sources`: a list of items, each with a kind (inspection | repair | report | regulator_event | note | knowledge | document), an ID or document-section reference, and a label.
- Knowledge markers ("corrected by…", "unconfirmed claim", "disputed", "your rule, not the manual") are rendered with the built-in Tag or Callout components.
- The system prompt is generated from this library by OpenUI's prompt generator.

**Module: Chat UI**
- OpenUI's chat shell with a header containing the user picker (from the fleet's user list), the model picker and a link to the evals page.
- The conversation list is filtered to the selected user. There are starter questions per role and a visible tool trace. Styling is consistent across charts, map and heatmap.

**Module: Eval Runner and Evals page**
- Scenario files (one for the 18 example questions; final questions are added the same way) are ordered steps. Each step has a user, a fresh-or-continue-chat marker, the question, and the expected facts and visual.
- The runner resets the knowledge store to dataset-only, runs each step through the same agent path the UI uses, and has a grader model judge each answer for facts, evidence and visual.
- It writes a results file plus a Markdown report, and accepts a model override.
- The in-app evals page reads the same results: per-question pass/fail, model, cost, latency, the facts that didn't match, and the rendered OpenUI answer.

**Operational**
- One command each for install, load and dev.
- The repo is public under the MIT license; the dataset clone is gitignored and referenced through `DATA_DIRS`.

## Testing Decisions

- Good tests check external behaviour at the highest seam: given loaded data (plus knowledge entries), what do the fleet views return? They never test parsing helpers, prompt text or UI internals.
- **Seam 1: golden view checks** (fast, deterministic, no LLM). They load the sample dataset and assert against the fleet views. Base-data checks:
  - WELL-0001 latest inspection INS-0001-0203 is non-producing, with recorded status mismatched (Q1);
  - the four non-producing NE-08 wells (Q2);
  - 13 readings with 2 non-producing (Q3);
  - 6 spills / 15.1 bbl, with INS-0001-0070 excluded (Q4);
  - 21 days of 2025 downtime (Q5);
  - NE-07 top 3 by downtime 49/42/42 (Q6);
  - 4 NE-08 spills in 90 days (Q7);
  - the 2026 heatmap totals 35/43/37/26 (Q8);
  - WELL-0001 SR-01/SR-02/SR-03/RC-04 status (Q9);
  - SW-24 containment breaches for WELL-0082 and WELL-0100 (Q10);
  - repair costs 25,794 / 46,942 / 5,176 (Q11);
  - NE-07 pump jack RCA candidates (Q14).

  Overlay checks record a knowledge entry through the Knowledge Store interface and re-query:
  - the WELL-0164 temperature correction makes it producing and removes it from the Q2 list (Q12);
  - the WELL-0151 volume correction to 5.4 bbl makes it reportable, with SR-01 overdue and SR-03 due 23 Nov 2026 (Q13);
  - the T350 RCA override adds WELL-0120 and not WELL-0102 (Q14);
  - a contradicted claim is stored as unconfirmed and changes nothing (Q17);
  - INS-0101-0197 shows as disputed and still counts as a spill (Q18).
- **Seam 2: the eval runner**, end to end through the real agent and model, using the 18-question scenario file. It's the acceptance test for prompts, tools, memory scoping and visual choice.
- There are no unit tests, component tests or UI tests. There is no prior art in the repo; it's greenfield.

## Out of Scope

- Hosting or deployment; the product runs locally for the video and demo.
- Authentication and role-based permissions; anyone can correct anything, and every change is attributed.
- Image analysis or generating evidence images; image paths are cited only.
- Vector or embedding retrieval; manuals and SOPs are small enough to include whole, and reports use full-text search.
- Simulated multi-day time; "yesterday" means the user's previous conversations.
- A separate eval dashboard app; it's a page in the same app.
- Training or fine-tuning models.
- Editing or deleting knowledge entries from the UI; corrections are made through chat.

## Further Notes

- Domain vocabulary: `GLOSSARY.md`. Decision record: `docs/adr/0001-corrections-as-overlay.md`. Challenge docs: `PROBLEM_STATEMENT.md`, `DATASET_GUIDE.md`, `EXAMPLE_QUESTIONS.md`.
- Reference implementations: OpenUI's Pi harness example (thesysdev/openui, `examples/harnesses/pi`) and the Pi agent-core README (earendil-works/pi). The example pins Pi 0.79 and the coding-agent SDK, so adapt its frontend and stream mapping, not its backend.
- Data quirks confirmed by profiling the sample:
  - all record keys are always present except `inspection_id` on notes (corrections only);
  - all 56 dataset corrections are "not a crude spill";
  - 2 of 1,509 report files have non-standard names;
  - dispute notes name their inspection only in the text.
- Key gotchas:
  - an open repair's `completed_at` is its planned end and can be after `AS_OF`;
  - `maintenance.downtime_hours` must never be used for downtime;
  - the docs state Q6's window as 16 Jun to 16 Oct 2026, so let the golden checks settle exactly where relative-period boundaries fall rather than assuming;
  - RC-04's 30-day response window and SR-03's 60-day verification window run from the event and discovery dates.
- The final questions arrive in the last two hours. The runbook is: load the test data alongside the sample, add a scenario file, run the evals, then record the answers for page 2 of the write-up.
