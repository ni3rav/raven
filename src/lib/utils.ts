import { SQL } from "bun";
import { env } from "@/lib/env";
import type { MemoryFtsRow, MemoryRecord } from "@/db/db";

const db = new SQL(`sqlite://${env.DB_PATH}`);

// Fuzzy search with AND then OR fallback
export async function executeFuzzySearch(keywords: string[]) {
  const clean = keywords
    .filter(Boolean)
    .map((k) => k.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  if (!clean.length) return [];

  const run = async (expr: string): Promise<MemoryFtsRow[]> =>
    db<MemoryFtsRow[]>`
      SELECT rowid, * 
      FROM memories_idx 
      WHERE memories_idx MATCH ${expr}
      ORDER BY rank
      LIMIT 30
    `;

  // 1) AND search
  const andExpr = clean.map((k) => `"${k}"`).join(" AND ");
  let rows: MemoryFtsRow[] = await run(andExpr);

  // 2) OR search if too few
  if (rows.length < 5) {
    const orExpr = clean.map((k) => `"${k}"`).join(" OR ");
    const more = await run(orExpr);
    const seen = new Set(rows.map((r) => r.rowid));
    for (const r of more) if (!seen.has(r.rowid)) rows.push(r);
  }

  if (!rows.length) return [];

  const ids = rows.map((r) => r.rowid);
  const full = await db<MemoryRecord[]>`
    SELECT id, raw_text, ai_tags, timestamp
    FROM memories
    WHERE id IN ${db(ids)}
  `;

  return full;
}

// Delete by ids
export async function deleteByIds(ids: number[]) {
  if (!ids.length) return;
  await db`DELETE FROM memories WHERE id IN ${db(ids)}`;
}
