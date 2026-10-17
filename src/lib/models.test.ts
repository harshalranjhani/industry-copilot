import { describe, expect, it } from "vitest";
import { modelCatalog } from "./models";

describe("model catalog", () => {
  it("offers exactly the allowlisted models with the built-in default preselected", () => {
    const catalog = modelCatalog();

    expect(catalog.models.map((m) => m.id)).toEqual([
      "openai/gpt-6-luna",
      "anthropic/claude-sonnet-5.5",
      "anthropic/claude-haiku-5.5",
      "google/gemini-3.5-flash",
      "deepseek/deepseek-v4-pro",
    ]);
    expect(catalog.defaultId).toBe("openai/gpt-6-luna");
  });

  it("preselects the configured default when it is allowlisted", () => {
    expect(modelCatalog("anthropic/claude-haiku-5.5").defaultId).toBe("anthropic/claude-haiku-5.5");
  });

  it("treats a blank configured default as unset", () => {
    expect(modelCatalog("  ").defaultId).toBe("openai/gpt-6-luna");
  });

  it("refuses a configured default outside the allowlist", () => {
    expect(() => modelCatalog("openai/gpt-3")).toThrow(/openai\/gpt-3.*allowlist/i);
  });
});
