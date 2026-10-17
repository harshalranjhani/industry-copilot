import { describe, expect, it } from "vitest";
import { starterQuestions } from "./starters";

const ROLES = [
  "production_supervisor",
  "field_operator",
  "field_inspector",
  "maintenance_lead",
  "maintenance_technician",
  "hse_officer",
];

describe("starterQuestions", () => {
  it.each(ROLES)("offers %s a few starters, each with a short label and a full prompt", (role) => {
    const starters = starterQuestions(role);
    expect(starters.length).toBeGreaterThanOrEqual(2);
    for (const s of starters) {
      expect(s.displayText.length).toBeGreaterThan(0);
      expect(s.displayText.length).toBeLessThanOrEqual(40);
      expect(s.prompt.length).toBeGreaterThan(s.displayText.length);
    }
  });

  it("gives each role starters of its own", () => {
    const prompts = ROLES.map((r) => starterQuestions(r).map((s) => s.prompt).join("|"));
    expect(new Set(prompts).size).toBe(ROLES.length);
  });

  it("falls back to general starters for a role it does not know", () => {
    const starters = starterQuestions("drone_pilot");
    expect(starters.length).toBeGreaterThanOrEqual(2);
    expect(starters).toEqual(starterQuestions(""));
  });
});
