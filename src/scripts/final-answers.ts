// Capture the final-question conversation through production chat, without a grader.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
import { openRouterChatOptions } from "../lib/agent/openrouter";
import { createChatHandler } from "../lib/chat/chat-handler";
import { openConversationStore } from "../lib/conversations/store";
import { readDataConfig } from "../lib/data/config";
import { openFleet } from "../lib/data/fleet";
import { clearChatKnowledge } from "../lib/data/knowledge";

process.loadEnvFile(".env");
const dir = resolve("output/answers");
mkdirSync(dir, { recursive: true });
const source = readFileSync(join(dir, "final-questions.md"), "utf8");
const prompts = [...source.matchAll(/\*"([\s\S]*?)"\*/g)].map((m) => m[1]!.replace(/\s+/g, " ").trim());
const steps = (JSON.parse(readFileSync("evals/final-questions.json", "utf8")) as { steps: { id: string; user: string; chat: string; question: string }[] }).steps;
assert.equal(prompts.length, 21);
assert.deepEqual(prompts, steps.map((s) => s.question));
const data = readDataConfig();
const knowledgePath = join(dir, "knowledge.db");
if (!existsSync(join(dir, "final-answers.json"))) {
  copyFileSync(data.knowledgePath, knowledgePath);
  clearChatKnowledge(knowledgePath);
}
const fleet = openFleet(data.dbPath, { knowledgePath, asOf: data.asOf });
const conversations = openConversationStore(join(dir, "conversations.db"));
const chat = createChatHandler(openRouterChatOptions({ fleet, conversations }));
const threads = new Map<string, string>();
const answers: { id: string; user: string; question: string; answer: string; threadId?: string }[] = existsSync(join(dir, "final-answers.json"))
  ? JSON.parse(readFileSync(join(dir, "final-answers.json"), "utf8")).answers : [];
assert.deepEqual(answers.map((a) => a.id), steps.slice(0, answers.length).map((s) => s.id));
try {
  for (const step of steps) {
    const user = fleet.findUser(step.user);
    assert(user, `Unknown user ${step.user}`);
    const saved = answers.find((a) => a.id === step.id);
    if (saved) { if (saved.threadId) threads.set(user.userId, saved.threadId); continue; }
    const threadId = step.chat === "continue" ? threads.get(user.userId)! : crypto.randomUUID();
    assert(threadId);
    threads.set(user.userId, threadId);
    const q = Number(step.id.match(/^F(\d+)/)![1]);
    const section = source.match(new RegExp(`## Q${q}\\.[\\s\\S]*?(?=\\n## Q|$)`))![0];
    const show = section.match(/- \*\*Show:\*\*([\s\S]*?)(?=\n##|$)/)?.[1]?.trim() ?? "";
    const question = step.question + (show ? `\n\nShow: ${show}` : "");
    console.log(`Starting ${step.id} as ${step.user}`);
    const response = await chat(new Request("http://localhost/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json", "x-copilot-user": user.userId, "x-copilot-model": "openai/gpt-6-luna" },
      body: JSON.stringify({ threadId, messages: [{ role: "user", content: question }] }),
    }));
    assert(response.ok, `Chat HTTP ${response.status}`);
    let answer = "";
    assert(response.body);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const consume = (line: string) => {
      if (!line.trim()) return;
      const chunk = JSON.parse(line);
      const delta = chunk.choices?.[0]?.delta;
      for (const tool of delta?.tool_calls ?? []) console.log(`${step.id}: tool ${tool.function?.name}`);
      if (delta?.role !== "tool") answer += delta?.content ?? "";
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
      lines.forEach(consume);
    }
    if (buffer.trim()) consume(buffer);
    assert(answer.trim(), `Empty answer ${step.id}`);
    assert(!/Callout\("error", "(?:Model error|Agent error)"/.test(answer), `Model failed on ${step.id}; see saved output`);
    answers.push({ id: step.id, user: step.user, question: step.question, answer, threadId });
    writeFileSync(join(dir, "final-answers.json"), JSON.stringify({ model: "openai/gpt-6-luna", asOf: data.asOf, answers }, null, 2) + "\n");
    console.log(`Saved ${step.id} (${answers.length}/${steps.length})`);
  }
} finally {
  conversations.close();
  fleet.close();
}
