import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type ConversationStore, openConversationStore } from "./store";

describe("preferences", () => {
  let dir: string;
  let store: ConversationStore;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "prefs-"));
    store = openConversationStore(join(dir, "c.db"));
  });
  afterEach(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("are kept per user, and one user can't see or remove another's", () => {
    const michael = store.forUser("U-201");
    const jessica = store.forUser("U-202");
    const saved = michael.addPreference("  Draw wellhead temperature in red ");
    expect(saved).toMatchObject({ id: "PREF-1", text: "Draw wellhead temperature in red" });
    expect(jessica.preferences()).toEqual([]);
    expect(jessica.removePreference(saved.id)).toBe(false);
    expect(michael.preferences().map((p) => p.text)).toEqual(["Draw wellhead temperature in red"]);
    expect(michael.removePreference("pref-1")).toBe(true);
    expect(michael.preferences()).toEqual([]);
    expect(michael.removePreference("not an id")).toBe(false);
  });
});
