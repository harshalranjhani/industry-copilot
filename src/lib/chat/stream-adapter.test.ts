import { EventType, type AGUIEvent } from "@openuidev/react-headless";
import { describe, expect, it } from "vitest";
import { copilotStreamAdapter } from "./stream-adapter";

async function collect(response: Response): Promise<AGUIEvent[]> {
  const events: AGUIEvent[] = [];
  for await (const event of copilotStreamAdapter().parse(response)) events.push(event);
  return events;
}

const answerText = (events: AGUIEvent[]) =>
  events.flatMap((e) => (e.type === EventType.TEXT_MESSAGE_CONTENT ? [(e as { delta: string }).delta] : [])).join("");

describe("copilotStreamAdapter on a failed request", () => {
  it("shows the server's error message as an error callout instead of an empty answer", async () => {
    const res = Response.json({ error: "Pick who you are first." }, { status: 401 });
    const events = await collect(res);
    expect(events.map((e) => e.type)).toEqual([
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
    ]);
    expect(answerText(events)).toContain('Callout("error"');
    expect(answerText(events)).toContain("Pick who you are first.");
  });

  it("names the status when the body says nothing readable", async () => {
    const events = await collect(new Response("<html>Bad gateway</html>", { status: 502 }));
    expect(answerText(events)).toContain("502");
  });

  it("still streams a successful answer as before", async () => {
    const body =
      JSON.stringify({ choices: [{ delta: { role: "assistant" } }] }) +
      "\n" +
      JSON.stringify({ choices: [{ delta: { content: "hi" } }] }) +
      "\n" +
      JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] }) +
      "\n";
    const events = await collect(new Response(body));
    expect(answerText(events)).toBe("hi");
  });
});
