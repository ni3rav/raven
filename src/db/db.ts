import { SQL } from "bun";

// Shared table/FTS row types for reuse in queries
export type MemoryRecord = {
  id: number;
  timestamp: string;
  raw_text: string | null;
  ai_tags: string | null;
};

export type MemoryFtsRow = {
  rowid: number;
  raw_text: string | null;
  ai_tags: string | null;
  rank?: number;
};

export async function initDb(dbPath: string) {
  const db = new SQL(`sqlite://${dbPath}`);

  // main memories table
  await db`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      raw_text TEXT,
      ai_tags TEXT
    )
  `;

  // fts5 virtual table for full-text search
  await db`
    CREATE VIRTUAL TABLE IF NOT EXISTS memories_idx 
    USING fts5(raw_text, ai_tags, content='memories', content_rowid='id')
  `;

  // trigger to sync on insert
  await db`
    CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
      INSERT INTO memories_idx(rowid, raw_text, ai_tags) VALUES (new.id, new.raw_text, new.ai_tags);
    END
  `;

  // trigger to sync on delete
  await db`
    CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
      INSERT INTO memories_idx(memories_idx, rowid, raw_text, ai_tags) VALUES('delete', old.id, old.raw_text, old.ai_tags);
    END
  `;

  await db.close();
}
