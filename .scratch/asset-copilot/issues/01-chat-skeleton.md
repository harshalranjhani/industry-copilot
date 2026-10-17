# 01: Chat skeleton: Pi + OpenRouter + OpenUI streaming

**What to build:** A user opens the app, types a message and watches a generated OpenUI answer (a Card inside a Stack, with a Sources block) stream into the chat. The tool calls the agent made show in the tool trace. This proves the riskiest wiring before any data exists: Pi agent-core 1.x running on OpenRouter, Pi events mapped to the OpenAI-style chunk stream the OpenUI chat shell expects, and an OpenUI component library whose generated prompt drives the model. The frontend and route shape are adapted from OpenUI's Pi harness example, but the backend uses `@earendil-works/pi-agent-core`, not the coding-agent SDK. See the spec's "Stack and shape", "Copilot Agent" and "Component Library" sections.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] One Next.js app (React 19, TypeScript, pnpm) starts with a single dev command; `OPENROUTER_API_KEY` and the default model `openai/gpt-6-luna` come from configuration
- [ ] The agent has no shell, file or edit tools. A placeholder domain tool exists (e.g. an echo or `ping`) so the tool trace can be shown
- [ ] Assistant text deltas stream progressively into the chat; tool execution start and end appear as tool-call entries in the trace
- [ ] The final assistant message is pure OpenUI Lang with a root `Stack`, and renders without parse errors
- [ ] A custom `Sources` component (items of kind, id or reference, and label) is registered in the extended library, and the system prompt requires it in every answer
- [ ] Only the newest user message is sent into Pi; the server keeps the transcript for the conversation (in memory is fine at this stage)
- [ ] The extended component library is created once, at module scope
