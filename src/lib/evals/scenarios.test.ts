import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadScenarios } from "./scenarios";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "copilot-scenarios-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function scenarioFile(steps: unknown[]): string {
  const path = join(dir, "scenarios.json");
  writeFileSync(path, JSON.stringify({ name: "Test scenarios", steps }));
  return path;
}

const step = (overrides: Record<string, unknown> = {}) => ({
  id: "Q1",
  user: "Michael Turner",
  chat: "new",
  question: "Is WELL-0001 producing oil right now?",
  expectedFacts: ["No, it is not producing oil"],
  expectedVisual: "none",
  ...overrides,
});

describe("loadScenarios", () => {
  it("reads ordered steps with their user, chat marker, question, expected facts and visual", () => {
    const loaded = loadScenarios(
      scenarioFile([
        step(),
        step({ id: "Q2", chat: "continue", question: "And WELL-0002?", expectedFacts: ["Yes", "Inspected 15 Oct"], expectedVisual: "table" }),
      ]),
    );

    expect(loaded.name).toBe("Test scenarios");
    expect(loaded.steps.map((s) => s.id)).toEqual(["Q1", "Q2"]);
    expect(loaded.steps[1]).toEqual({
      id: "Q2",
      user: "Michael Turner",
      chat: "continue",
      question: "And WELL-0002?",
      expectedFacts: ["Yes", "Inspected 15 Oct"],
      expectedVisual: "table",
    });
  });

  it("rejects a step that is missing its expected facts, naming the step", () => {
    const { expectedFacts: _, ...incomplete } = step({ id: "Q7" });
    expect(() => loadScenarios(scenarioFile([incomplete]))).toThrow(/Q7.*expectedFacts/);
  });

  it("rejects an unknown chat marker or visual", () => {
    expect(() => loadScenarios(scenarioFile([step({ chat: "resume" })]))).toThrow(/chat/);
    expect(() => loadScenarios(scenarioFile([step({ expectedVisual: "pie_chart" })]))).toThrow(/expectedVisual/);
  });

  it("rejects a continued chat for a user who has no chat to continue", () => {
    expect(() =>
      loadScenarios(scenarioFile([step({ chat: "continue" })])),
    ).toThrow(/Q1.*continue.*Michael Turner/);
    // Jessica has no earlier chat even though Michael does.
    expect(() =>
      loadScenarios(scenarioFile([step(), step({ id: "Q2", user: "Jessica Reed", chat: "continue" })])),
    ).toThrow(/Q2.*continue.*Jessica Reed/);
  });

  it("rejects duplicate step IDs", () => {
    expect(() => loadScenarios(scenarioFile([step(), step({ chat: "continue" })]))).toThrow(/Q1.*twice/);
  });
});

describe("the 18 example questions", () => {
  const { name, steps } = loadScenarios(join(process.cwd(), "evals/example-questions.json"));
  const questionOf = (id: string) => id.split(".")[0];

  it("cover Q1 to Q18, in order", () => {
    const questions = [...new Set(steps.map((s) => questionOf(s.id)))];
    expect(name).toMatch(/example/i);
    expect(questions).toEqual(Array.from({ length: 18 }, (_, i) => `Q${i + 1}`));
  });

  it("play the multi-step and multi-user scenarios (Q11 to Q18) as the right people in the right chats", () => {
    const steps_ = (q: string) => steps.filter((s) => questionOf(s.id) === q).map((s) => `${s.user} ${s.chat}`);
    expect(steps_("Q11")).toEqual(["Michael Turner new", "Michael Turner new"]);
    expect(steps_("Q12")).toEqual(["Michael Turner new", "Michael Turner continue"]);
    expect(steps_("Q14")).toEqual(["Michael Turner new", "Michael Turner continue", "Michael Turner new"]);
    expect(steps_("Q15")).toEqual(["Jessica Reed new", "Laura Simmons new"]);
    expect(steps_("Q16")).toEqual(["Jake Morales new", "Michael Turner new", "Jessica Reed new"]);
    expect(steps_("Q17")).toEqual(["Michael Turner new", "Tyler Hughes new", "Jake Morales new"]);
  });

  it("name the visual wherever the example answers show one", () => {
    const visualOf = (id: string) => steps.find((s) => s.id === id)?.expectedVisual;
    expect(visualOf("Q2")).toBe("table");
    expect(visualOf("Q3")).toBe("line_chart");
    expect(visualOf("Q6")).toBe("bar_chart");
    expect(visualOf("Q7")).toBe("map");
    expect(visualOf("Q8")).toBe("heatmap");
  });
});

describe("the complex scenario file", () => {
  const { steps } = loadScenarios("evals/complex-questions.json");

  it("loads, and continues chats only after the same user's earlier step", () => {
    expect(steps.length).toBeGreaterThan(15);
    expect(steps.filter((s) => s.chat === "continue").map((s) => s.id)).toEqual(["P1.3", "P2.2", "K1.2", "H2", "U2"]);
  });

  it("saves a preference before the steps that rely on it", () => {
    const ids = steps.map((s) => s.id);
    expect(ids.indexOf("P1.1")).toBeLessThan(ids.indexOf("P1.2"));
    expect(ids.indexOf("K1.1")).toBeLessThan(ids.indexOf("K2"));
    expect(ids.indexOf("P2.1")).toBeLessThan(ids.indexOf("E1"));
  });
});
