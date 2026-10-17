# 10: Eval runner and EVALS.md

**What to build:** A builder runs one command to replay all 18 example scenarios through the real copilot and gets a graded report. The runner:
- resets the knowledge store to dataset-only;
- plays each step as the right user, in a new or continued chat as the scenario says;
- grades each answer's facts, evidence and visual with a grader model;
- writes a results file and `EVALS.md`.

It accepts a model override for comparing models, and adding the final questions is just a new scenario file.

**Blocked by:** 07 — Compliance ripple and rule overrides; 08 — Users and private memory; 09 — Model switcher and usage

**Status:** ready-for-agent

- [ ] The scenario file format is ordered steps. Each step has a user, a new-or-continue chat marker, the question, the expected facts (a list), and the expected visual. The 18 example questions are encoded from `EXAMPLE_QUESTIONS.md`, including the multi-step and multi-user scenarios (Q11–Q18)
- [ ] The runner uses the same agent path as the UI, not a separate prompt, and resets chat-origin knowledge and conversations before a run
- [ ] The grader returns, per step: pass or fail, the matched and missed facts, whether sources were cited, and whether the visual matches
- [ ] Results (answers as OpenUI Lang, grades, model, tokens, cost, latency) are written to a results file, and `EVALS.md` gets a summary table plus per-question details
- [ ] The run accepts a model override and a scenario-file argument
- [ ] One full run on the default model completes; the pass rate is recorded, whatever it is
