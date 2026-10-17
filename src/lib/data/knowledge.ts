import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * The knowledge store: one entry kind for dataset notes and (later) what users
 * teach the copilot in chat. It lives in its own file and is never rebuilt with
 * the data store; a reload replaces only `origin = 'dataset'` entries (ADR 0001).
 */
export const KNOWLEDGE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS knowledge_entries (
  entry_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,            -- note | correction | claim | rule_override
  scope TEXT NOT NULL,           -- inspection_field | well | well_type
  asset_id TEXT,
  inspection_id TEXT,
  field TEXT,                    -- the corrected inspection field
  well_type TEXT,
  rule_key TEXT,
  value,
  original_value,
  text TEXT,
  reason TEXT,
  author_user_id TEXT,
  created_at TEXT,
  valid_from TEXT,
  valid_to TEXT,
  status TEXT NOT NULL DEFAULT 'accepted',  -- accepted | unconfirmed | disputed
  origin TEXT NOT NULL,          -- dataset | chat
  note_type TEXT                 -- the dataset's own label: operator_feedback, operator_note, correction
);
CREATE INDEX IF NOT EXISTS knowledge_by_well ON knowledge_entries (asset_id);
CREATE INDEX IF NOT EXISTS knowledge_by_inspection ON knowledge_entries (inspection_id);

-- Every inspection a note refers to, whether through its field or by naming it in the text.
CREATE TABLE IF NOT EXISTS knowledge_inspection_links (
  entry_id TEXT NOT NULL,
  inspection_id TEXT NOT NULL,
  PRIMARY KEY (entry_id, inspection_id)
);
`;

export interface DatasetNote {
  note_id: string;
  asset_id: string;
  created_at?: string;
  author_user_id?: string;
  note_type: string;
  inspection_id?: string;
  text?: string;
  valid_from?: string;
  valid_to?: string | null;
}

const INSPECTION_ID = /INS-\d+-\d+/g;

/** Creates the knowledge store if needed. Safe to call on an existing one. */
export function openKnowledgeStore(path: string): DatabaseSync {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(KNOWLEDGE_TABLES_SQL);
  return db;
}

/**
 * Replaces the dataset-origin entries with the given notes, leaving every
 * other entry alone. A correction note means `spill_detected = false` for its
 * inspection; inspection IDs named in any note's text are linked to it.
 */
export function replaceDatasetKnowledge(path: string, notes: DatasetNote[]): void {
  const db = openKnowledgeStore(path);
  try {
    db.exec("BEGIN");
    db.exec(
      "DELETE FROM knowledge_inspection_links WHERE entry_id IN (SELECT entry_id FROM knowledge_entries WHERE origin = 'dataset')",
    );
    db.exec("DELETE FROM knowledge_entries WHERE origin = 'dataset'");
    const insertEntry = db.prepare(
      `INSERT OR REPLACE INTO knowledge_entries
         (entry_id, kind, scope, asset_id, inspection_id, field, value, original_value, text, author_user_id,
          created_at, valid_from, valid_to, status, origin, note_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accepted', 'dataset', ?)`,
    );
    const insertLink = db.prepare("INSERT OR IGNORE INTO knowledge_inspection_links VALUES (?, ?)");
    for (const note of notes) {
      const isCorrection = note.note_type === "correction" && Boolean(note.inspection_id);
      insertEntry.run(
        note.note_id,
        isCorrection ? "correction" : "note",
        isCorrection ? "inspection_field" : "well",
        note.asset_id,
        note.inspection_id ?? null,
        isCorrection ? "spill_detected" : null,
        isCorrection ? 0 : null,
        isCorrection ? 1 : null,
        note.text ?? null,
        note.author_user_id ?? null,
        note.created_at ?? null,
        note.valid_from ?? null,
        note.valid_to ?? null,
        note.note_type,
      );
      const linked = new Set([...(note.text?.match(INSPECTION_ID) ?? []), ...(note.inspection_id ? [note.inspection_id] : [])]);
      for (const inspectionId of linked) insertLink.run(note.note_id, inspectionId);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  } finally {
    db.close();
  }
}
