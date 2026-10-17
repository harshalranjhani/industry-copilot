# 12: Product polish

**What to build:** The copilot feels like a finished product to a judge cloning the repo:
- starter questions suited to the selected user's role;
- a tidy tool trace with readable labels;
- consistent styling across charts, map, heatmap, cards and knowledge markers;
- empty and error states;
- one command each to install, load and run;
- a README that explains how to run it and the runbook for the test dataset.

**Blocked by:** 04 — Map and heatmap; 07 — Compliance ripple and rule overrides; 08 — Users and private memory; 09 — Model switcher and usage

**Status:** ready-for-agent

- [ ] Starter questions per role (production supervisor, field operator, field inspector, maintenance lead, maintenance technician, HSE officer), shown in a new chat
- [ ] Tool-trace entries use friendly labels (e.g. "Querying fleet views", "Reading report MNT-0001-029")
- [ ] Knowledge markers, cards, tables, charts, map and heatmap share one visual language in light and dark themes
- [ ] Model or tool errors show a readable message in the chat instead of a broken render
- [ ] A fresh clone reaches a working app with install, load and dev, following the README; the README documents `DATA_DIRS`, `AS_OF`, `OPENROUTER_API_KEY` and how to load the test dataset alongside the sample
