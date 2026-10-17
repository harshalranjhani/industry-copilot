# 11: Evals page

**What to build:** An in-app `/evals` page, linked from the header, shows the latest eval runs. It gives a row per question with pass or fail, model, cost and latency. Expanding a row shows the missed facts and the full answer rendered with the same OpenUI renderer as the chat. It's useful for debugging and for 30 seconds of the demo video.

**Blocked by:** 10 — Eval runner

**Status:** ready-for-agent

- [ ] The page reads the runner's results file(s); you can pick a run when several exist (e.g. different models)
- [ ] It shows summary totals: pass rate, total cost and mean latency
- [ ] Rows expand to show the expected facts, missed facts, and the rendered OpenUI answer including its Sources
