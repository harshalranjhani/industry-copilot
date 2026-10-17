# 09: Model switcher and usage tracking

**What to build:** A builder picks the model for a new conversation from a header dropdown: `openai/gpt-6-luna` (default), `anthropic/claude-sonnet-5.5`, `anthropic/claude-haiku-5.5`, `google/gemini-3.5-flash` or `deepseek/deepseek-v4-pro`. A conversation keeps its model, and every answer records model, input and output tokens, cost and latency, for the write-up and the evals.

**Blocked by:** 08 — Users and private memory

**Status:** ready-for-agent

- [ ] The header dropdown lists exactly the allowlisted models, with the configured default preselected
- [ ] The chosen model is stored on the conversation and used for every turn in it, including resumed ones
- [ ] Each answer stores model, input and output tokens, cost in USD (from OpenRouter usage or a pricing table) and wall-clock latency
- [ ] An answer's usage is visible in the UI (e.g. a small footer on the message)
