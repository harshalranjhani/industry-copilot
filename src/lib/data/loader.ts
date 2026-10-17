import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type Manual, parseRules } from "./rules";
import { TABLES_SQL, VIEWS_SQL } from "./schema";

export interface LoadOptions {
  /** Dataset roots, each holding `fleet/` and `assets/`. Later roots win on ID collisions. */
  roots: string[];
  dbPath: string;
}

export interface LoadSummary {
  wells: number;
  inspections: number;
  users: number;
  areas: number;
  rules: number;
  documents: number;
}

type Json = Record<string, any>;

const readJson = (path: string): Json => JSON.parse(readFileSync(path, "utf-8"));

function readJsonl(path: string): Json[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf-8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

const listDir = (dir: string) => (existsSync(dir) ? readdirSync(dir).sort() : []);

/** `null` for undefined so optional JSON fields bind as SQL NULL. */
const orNull = <T>(value: T | undefined): T | null => value ?? null;

/**
 * Rebuilds the data store from scratch out of the given dataset roots. Records
 * are upserted by primary ID, so a later root extends or overrides an earlier one.
 * Never touches anything but `dbPath`: the knowledge store is separate (ADR 0001).
 * Throws, naming the document, when a required rule can't be parsed.
 */
export function loadDataset({ roots, dbPath }: LoadOptions): LoadSummary {
  if (roots.length === 0) throw new Error("No dataset roots given");
  for (const root of roots) {
    if (!existsSync(join(root, "fleet"))) throw new Error(`Dataset root has no fleet/ folder: ${root}`);
  }

  // Build beside the target and swap at the end, so a failed load keeps the old store.
  mkdirSync(dirname(dbPath), { recursive: true });
  const buildPath = `${dbPath}.building`;
  rmSync(buildPath, { force: true });
  const db = new DatabaseSync(buildPath);
  try {
    db.exec(TABLES_SQL + VIEWS_SQL);

    const upsert = (table: string, row: Record<string, unknown>) => {
      const columns = Object.keys(row);
      db.prepare(
        `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
      ).run(...(Object.values(row) as any[]));
    };

    const manuals = new Map<string, Manual>();
    db.exec("BEGIN");
    for (const root of roots) {
      const fleetDir = join(root, "fleet");

      for (const file of ["areas.json", "users.json"]) {
        if (!existsSync(join(fleetDir, file))) continue;
        const data = readJson(join(fleetDir, file));
        for (const team of data.teams ?? []) {
          upsert("teams", { team_id: team.team_id, name: team.name, lead_user_id: orNull(team.lead_user_id) });
        }
        for (const area of data.areas ?? []) {
          upsert("areas", {
            area_id: area.area_id,
            name: area.name,
            team_id: orNull(area.team_id),
            center_lat: orNull(area.center?.lat),
            center_lon: orNull(area.center?.lon),
          });
        }
        for (const user of data.users ?? []) {
          upsert("users", {
            user_id: user.user_id,
            name: user.name,
            role: user.role,
            team_id: orNull(user.team_id),
          });
        }
      }

      for (const [folder, kind] of [
        ["well-types", "manual"],
        ["sops", "sop"],
      ] as const) {
        for (const file of listDir(join(fleetDir, folder)).filter((f) => f.endsWith(".md"))) {
          const text = readFileSync(join(fleetDir, folder, file), "utf-8");
          const stem = basename(file, ".md");
          const documentId = /Document ID:\s*(\S+)/.exec(text)?.[1] ?? stem;
          upsert("documents", { path: `${folder}/${file}`, kind, document_id: documentId, text });
          if (kind === "manual") {
            const wellType = /well_type\s*=\s*"([^"]+)"/.exec(text)?.[1] ?? stem;
            manuals.set(wellType, { wellType, documentId, text });
          }
        }
      }

      const assetsDir = join(root, "assets");
      for (const wellDir of listDir(assetsDir)) {
        const dir = join(assetsDir, wellDir);
        if (!existsSync(join(dir, "metadata.json"))) continue;
        const meta = readJson(join(dir, "metadata.json"));
        upsert("wells", {
          asset_id: meta.asset_id,
          name: orNull(meta.name),
          well_type: meta.well_type,
          area_id: orNull(meta.area_id),
          team_id: orNull(meta.team_id),
          in_charge_user_id: orNull(meta.in_charge_user_id),
          lat: orNull(meta.location?.lat),
          lon: orNull(meta.location?.lon),
          installed_on: orNull(meta.installed_on),
          recorded_status: orNull(meta.recorded_status),
        });
        for (const ins of readJsonl(join(dir, "inspections.jsonl"))) {
          upsert("inspections", {
            inspection_id: ins.inspection_id,
            asset_id: ins.asset_id ?? meta.asset_id,
            inspected_at: ins.inspected_at,
            inspector_user_id: orNull(ins.inspector_user_id),
            method: orNull(ins.method),
            ambient_temp_c: orNull(ins.ambient_temp_c),
            wellhead_temp_c: orNull(ins.wellhead_temp_c),
            spill_detected: ins.spill_detected ? 1 : 0,
            spill_area_pct: orNull(ins.spill_area_pct),
            spill_est_volume_bbl: orNull(ins.spill_est_volume_bbl),
            notes: orNull(ins.notes),
          });
        }
      }
    }

    const rules = parseRules([...manuals.values()]);
    for (const rule of rules) {
      upsert("rules", {
        well_type: rule.wellType,
        key: rule.key,
        value: rule.value,
        unit: rule.unit,
        document: rule.document,
        section: rule.section,
      });
    }
    db.exec("COMMIT");

    const count = (table: string) =>
      (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
    const summary: LoadSummary = {
      wells: count("wells"),
      inspections: count("inspections"),
      users: count("users"),
      areas: count("areas"),
      rules: count("rules"),
      documents: count("documents"),
    };
    db.close();
    rmSync(dbPath, { force: true });
    renameSync(buildPath, dbPath);
    return summary;
  } catch (err) {
    db.close();
    rmSync(buildPath, { force: true });
    throw err;
  }
}
