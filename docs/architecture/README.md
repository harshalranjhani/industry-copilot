# Industry Copilot system design

Open `industry-copilot-system-design.excalidraw` in [Excalidraw](https://excalidraw.com) using **Open**, or drag the file onto its canvas. All components, labels, and arrows are editable.

- `industry-copilot-system-design.png`: high-resolution preview.
- `industry-copilot-system-design.svg`: scalable export.

This demo overview reflects the current implementation. Nine blocks show the chat, Pi agent, model provider, seven typed tools, SQL views, three SQLite stores, and manuals/SOPs feeding the agent's system prompt. Dynamic visuals, model selection, usage tracking and private preferences are included.

Read the manuals/SOPs into Pi's system prompt, then follow the chat across to the agent and model. The tools connect to operational data, shared knowledge and private memory. Full document text provides prompt guidance; parsed numerical rules drive the SQL views. Evaluations remain documented separately so this diagram can also be embedded in the system-design-only PDF.

Implementation references:

- Browser integration: `src/app/page.tsx`, `src/lib/openui/library.tsx`.
- Agent and model wiring: `src/lib/agent/openrouter.ts`, `src/lib/chat/chat-handler.ts`.
- Streaming translation: `src/lib/chat/stream-adapter.ts`.
- Runtime tools: `src/lib/agent/tools.ts`, `src/lib/agent/recall-tool.ts`, `src/lib/agent/preferences-tool.ts`.
- Prompt construction: `src/lib/agent/system-prompt.ts`.
- Dataset, views, and knowledge: `src/lib/data/loader.ts`, `schema.ts`, `fleet.ts`, `knowledge.ts`.
- Private memory: `src/lib/conversations/store.ts`, `memory.ts`.
- Store paths: `src/lib/data/config.ts`.

This is the local MVP architecture. Identity selection uses a user picker; production authentication is outside the documented scope. Diagram validation covers JSON structure, bindings, and visual rendering, rather than end-to-end application behaviour.
