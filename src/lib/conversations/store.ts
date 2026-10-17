import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

/** One conversation, without its transcript. */
export interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

/** A conversation with the full Pi transcript (JSON-serialisable messages). */
export interface StoredConversation extends Conversation {
  transcript: unknown[];
}

/** What one answer left behind in the user's private memory. */
export interface DigestInput {
  question: string;
  wells: string[];
  areas: string[];
  recordIds: string[];
  summary: string;
}

export interface DigestEntry extends DigestInput {
  conversationId: string;
  conversationTitle: string;
  createdAt: string;
}

/** What one answer cost: summed over every model call that went into it. */
export interface UsageInput {
  /** Position of the answer's final assistant message in the transcript. */
  messageIndex: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  /** Wall-clock time from the question to the end of the answer. */
  latencyMs: number;
}

export interface AnswerUsage extends UsageInput {
  conversationId: string;
  createdAt: string;
}

export class ConversationConflict extends Error {}

/**
 * One user's private conversations. Obtained only through
 * `ConversationStore.forUser`, so every read is bound to a single user ID:
 * there is no way to ask this handle about anyone else's history.
 */
export interface UserConversations {
  readonly userId: string;
  /** Throws ConversationConflict when the ID is already taken, by this or any other user. */
  create(input: { id?: string; title: string; model: string }): Conversation;
  /** Newest activity first. */
  list(): Conversation[];
  get(id: string): StoredConversation | undefined;
  saveTranscript(id: string, transcript: unknown[]): void;
  rename(id: string, title: string): Conversation | undefined;
  remove(id: string): boolean;
  recordDigest(conversationId: string, entry: DigestInput): void;
  recordUsage(conversationId: string, usage: UsageInput): void;
  /** Usage of every answer in the conversation, oldest first. */
  usage(conversationId: string): AnswerUsage[];
  /** The user's most recent answers, newest first. */
  recentDigest(options?: { limit?: number; excludeConversationId?: string }): DigestEntry[];
  /** Digest entries matching every word of the text, newest first. */
  searchDigest(text: string, options?: { limit?: number; excludeConversationId?: string }): DigestEntry[];
}

export interface ConversationStore {
  forUser(userId: string): UserConversations;
  close(): void;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  transcript TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS conversations_by_user ON conversations (user_id, updated_at);
CREATE TABLE IF NOT EXISTS digest_entries (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  question TEXT NOT NULL,
  wells TEXT NOT NULL,
  areas TEXT NOT NULL,
  record_ids TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS digest_by_user ON digest_entries (user_id, seq);
CREATE TABLE IF NOT EXISTS answer_usage (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  message_index INTEGER NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  latency_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS usage_by_conversation ON answer_usage (conversation_id, seq);
`;

type Row = Record<string, any>;

const toConversation = (row: Row): Conversation => ({
  id: row.id,
  title: row.title,
  model: row.model,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toDigest = (row: Row): DigestEntry => ({
  conversationId: row.conversation_id,
  conversationTitle: row.title,
  createdAt: row.created_at,
  question: row.question,
  wells: JSON.parse(row.wells),
  areas: JSON.parse(row.areas),
  recordIds: JSON.parse(row.record_ids),
  summary: row.summary,
});

const toUsage = (row: Row): AnswerUsage => ({
  conversationId: row.conversation_id,
  messageIndex: row.message_index,
  model: row.model,
  inputTokens: row.input_tokens,
  outputTokens: row.output_tokens,
  costUsd: row.cost_usd,
  latencyMs: row.latency_ms,
  createdAt: row.created_at,
});

/** Opens (creating if needed) the durable conversation file. */
export function openConversationStore(path: string, options: { now?: () => Date } = {}): ConversationStore {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  const now = options.now ?? (() => new Date());
  const stamp = () => now().toISOString();

  return {
    close: () => db.close(),
    forUser(userId) {
      const digestQuery = (where: string, params: (string | number)[], limit: number) =>
        (
          db
            .prepare(
              `SELECT d.*, c.title FROM digest_entries d JOIN conversations c ON c.id = d.conversation_id
               WHERE d.user_id = ? ${where} ORDER BY d.seq DESC LIMIT ?`,
            )
            .all(userId, ...params, limit) as Row[]
        ).map(toDigest);

      return {
        userId,
        create({ id = crypto.randomUUID(), title, model }) {
          const at = stamp();
          try {
            db.prepare(
              "INSERT INTO conversations (id, user_id, title, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            ).run(id, userId, title, model, at, at);
          } catch (err) {
            // Only a taken ID is a conflict; anything else (a failing disk) must not pose as "not found".
            if (err instanceof Error && /UNIQUE|constraint/i.test(err.message)) {
              throw new ConversationConflict(`Conversation ${id} already exists`);
            }
            throw err;
          }
          return { id, title, model, createdAt: at, updatedAt: at };
        },
        list() {
          return (
            db
              .prepare(
                "SELECT id, title, model, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC, rowid DESC",
              )
              .all(userId) as Row[]
          ).map(toConversation);
        },
        get(id) {
          const row = db.prepare("SELECT * FROM conversations WHERE id = ? AND user_id = ?").get(id, userId) as Row | undefined;
          return row && { ...toConversation(row), transcript: JSON.parse(row.transcript) };
        },
        saveTranscript(id, transcript) {
          db.prepare("UPDATE conversations SET transcript = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(
            JSON.stringify(transcript),
            stamp(),
            id,
            userId,
          );
        },
        rename(id, title) {
          db.prepare("UPDATE conversations SET title = ? WHERE id = ? AND user_id = ?").run(title, id, userId);
          const row = db
            .prepare("SELECT id, title, model, created_at, updated_at FROM conversations WHERE id = ? AND user_id = ?")
            .get(id, userId) as Row | undefined;
          return row && toConversation(row);
        },
        remove(id) {
          return Number(db.prepare("DELETE FROM conversations WHERE id = ? AND user_id = ?").run(id, userId).changes) > 0;
        },
        recordDigest(conversationId, entry) {
          // Insert through the owning-user check so an entry can never attach to someone else's conversation.
          db.prepare(
            `INSERT INTO digest_entries (conversation_id, user_id, question, wells, areas, record_ids, summary, created_at)
             SELECT id, user_id, ?, ?, ?, ?, ?, ? FROM conversations WHERE id = ? AND user_id = ?`,
          ).run(
            entry.question,
            JSON.stringify(entry.wells),
            JSON.stringify(entry.areas),
            JSON.stringify(entry.recordIds),
            entry.summary,
            stamp(),
            conversationId,
            userId,
          );
        },
        recordUsage(conversationId, usage) {
          // Insert through the owning-user check so usage can never attach to someone else's conversation.
          db.prepare(
            `INSERT INTO answer_usage (conversation_id, user_id, message_index, model, input_tokens, output_tokens, cost_usd, latency_ms, created_at)
             SELECT id, user_id, ?, ?, ?, ?, ?, ?, ? FROM conversations WHERE id = ? AND user_id = ?`,
          ).run(
            usage.messageIndex,
            usage.model,
            usage.inputTokens,
            usage.outputTokens,
            usage.costUsd,
            Math.round(usage.latencyMs),
            stamp(),
            conversationId,
            userId,
          );
        },
        usage(conversationId) {
          return (
            db
              .prepare("SELECT * FROM answer_usage WHERE conversation_id = ? AND user_id = ? ORDER BY seq")
              .all(conversationId, userId) as Row[]
          ).map(toUsage);
        },
        recentDigest({ limit = 15, excludeConversationId } = {}) {
          return excludeConversationId
            ? digestQuery("AND d.conversation_id <> ?", [excludeConversationId], limit)
            : digestQuery("", [], limit);
        },
        searchDigest(text, { limit = 10, excludeConversationId } = {}) {
          const words = text.toLowerCase().split(/\s+/).filter(Boolean);
          const haystack = "lower(d.question || ' ' || d.summary || ' ' || d.wells || ' ' || d.areas || ' ' || d.record_ids || ' ' || c.title)";
          const clauses = words.map(() => `${haystack} LIKE ? ESCAPE '\\'`);
          const params: (string | number)[] = words.map((w) => `%${w.replace(/[\\%_]/g, "\\$&")}%`);
          if (excludeConversationId) {
            clauses.push("d.conversation_id <> ?");
            params.push(excludeConversationId);
          }
          return digestQuery(clauses.length ? `AND ${clauses.join(" AND ")}` : "", params, limit);
        },
      };
    },
  };
}
