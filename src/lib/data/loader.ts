import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type DatasetNote, replaceDatasetKnowledge } from "./knowledge";
import { parseReport } from "./reports";
import { type Manual, parseRules, parseSopRules, type Sop } from "./rules";
import { TABLES_SQL } from "./schema";

export interface LoadOptions {
  /** Dataset roots, each holding `fleet/` and `assets/`. Later roots win on ID collisions. */
  roots: string[];
  dbPath: string;
  /** The durable knowledge store; only its dataset-origin entries are replaced. */
  knowledgePath: string;
}

export interface LoadSummary {
  wells: number;
  inspections: number;
  repairs: number;
  reports: number;
  regulatoryEvents: number;
  notes: number;
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
 * Dataset notes go to the knowledge store, replacing only dataset-origin entries (ADR 0001).
 * Throws, naming the document, when a required rule can't be parsed.
 */
export function loadDataset({ roots, dbPath, knowledgePath }: LoadOptions): LoadSummary {
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
    db.exec(TABLES_SQL);

    const upsert = (table: string, row: Record<string, unknown>) => {
      const columns = Object.keys(row);
      db.prepare(
        `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
      ).run(...(Object.values(row) as any[]));
    };

    const manuals = new Map<string, Manual>();
    const sops = new Map<string, Sop>();
    const notes = new Map<string, DatasetNote>();
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
          if (kind === "sop") sops.set(`${folder}/${file}`, { documentId, text });
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
        for (const job of readJsonl(join(dir, "maintenance.jsonl"))) {
          upsert("maintenance", {
            maintenance_id: job.maintenance_id,
            asset_id: job.asset_id ?? meta.asset_id,
            started_at: job.started_at,
            completed_at: orNull(job.completed_at),
            maintenance_type: orNull(job.maintenance_type),
            equipment_kind: orNull(job.equipment_kind),
            issue: orNull(job.issue),
            action_taken: orNull(job.action_taken),
            technician_user_id: orNull(job.technician_user_id),
            contractor: orNull(job.contractor),
            downtime_hours: orNull(job.downtime_hours),
            cost_labor_usd: orNull(job.cost_usd?.labor),
            cost_parts_usd: orNull(job.cost_usd?.parts),
            cost_total_usd: orNull(job.cost_usd?.total),
            triggered_by_inspection_id: orNull(job.triggered_by_inspection_id),
            report_file: orNull(job.report_file),
          });
          // A report is found only through its repair's report_file; names vary.
          const reportPath = job.report_file ? join(dir, job.report_file) : undefined;
          if (reportPath && existsSync(reportPath)) {
            const text = readFileSync(reportPath, "utf-8");
            const facts = parseReport(text);
            upsert("reports", {
              maintenance_id: job.maintenance_id,
              asset_id: job.asset_id ?? meta.asset_id,
              report_file: job.report_file,
              containment_hours: facts.containmentHours,
              stated_class: facts.statedClass,
              text,
            });
            db.prepare("DELETE FROM report_checks WHERE maintenance_id = ?").run(job.maintenance_id);
            facts.checks.forEach((check, position) =>
              upsert("report_checks", { maintenance_id: job.maintenance_id, position, ...check }),
            );
          }
        }
        for (const event of readJsonl(join(dir, "regulatory-events.jsonl"))) {
          upsert("regulatory_events", {
            event_id: event.event_id,
            asset_id: event.asset_id ?? meta.asset_id,
            date: event.date,
            agency: orNull(event.agency),
            event_type: orNull(event.event_type),
            protocol_id: orNull(event.protocol_id),
            related_inspection_id: orNull(event.related_inspection_id),
            hours_to_report: orNull(event.hours_to_report),
            detail: orNull(event.detail),
            fine_usd: orNull(event.fine_usd),
            status: orNull(event.status),
          });
        }
        for (const note of readJsonl(join(dir, "context.jsonl"))) {
          notes.set(note.note_id, { ...(note as DatasetNote), asset_id: note.asset_id ?? meta.asset_id });
        }
      }
    }

    const rules = [...parseRules([...manuals.values()]), ...parseSopRules([...sops.values()])];
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
    db.exec("INSERT INTO report_search (maintenance_id, asset_id, text) SELECT maintenance_id, asset_id, text FROM reports");
    db.exec("COMMIT");

    const count = (table: string) =>
      (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
    const summary: LoadSummary = {
      wells: count("wells"),
      inspections: count("inspections"),
      repairs: count("maintenance"),
      reports: count("reports"),
      regulatoryEvents: count("regulatory_events"),
      notes: notes.size,
      users: count("users"),
      areas: count("areas"),
      rules: count("rules"),
      documents: count("documents"),
    };
    db.close();
    replaceDatasetKnowledge(knowledgePath, [...notes.values()]);
    rmSync(dbPath, { force: true });
    renameSync(buildPath, dbPath);
    return summary;
  } catch (err) {
    db.close();
    rmSync(buildPath, { force: true });
    throw err;
  }
}
