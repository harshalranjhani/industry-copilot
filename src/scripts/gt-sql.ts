// Scratch: run read-only SQL over the fleet views of the loaded dataset (.env), against a copy of the knowledge store.
// `echo "SELECT ...;" | npx tsx src/scripts/gt-sql.ts [--clear]`  (--clear drops chat-recorded knowledge from the copy)
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { readDataConfig } from "../lib/data/config";
import { clearChatKnowledge } from "../lib/data/knowledge";
import { openFleet } from "../lib/data/fleet";
try {
  process.loadEnvFile(".env");
} catch {}
const { dbPath, knowledgePath, asOf } = readDataConfig();
mkdirSync("/tmp/gt", { recursive: true });
const kp = "/tmp/gt/knowledge.db";
if (!existsSync(kp) || process.argv.includes("--clear")) {
  copyFileSync(knowledgePath, kp);
  clearChatKnowledge(kp);
}
const fleet = openFleet(dbPath, { knowledgePath: kp, asOf });
const sqls = readFileSync(0, "utf8").split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
for (const sql of sqls) {
  try {
    const r = fleet.query(sql);
    console.log(`-- ${sql.slice(0, 100).replace(/\s+/g, " ")}`);
    console.log(r.columns.join(" | "));
    for (const row of r.rows) console.log(Object.values(row as object).map((v) => (v === null ? "∅" : String(v))).join(" | "));
    if (r.truncated) console.log("…truncated");
  } catch (err) {
    console.log(`-- ERROR: ${err instanceof Error ? err.message : String(err)}`);
  }
}
fleet.close();
