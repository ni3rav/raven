import Elysia, { t } from "elysia";
import { env } from "@/lib/env";
import { initDb } from "@/db/db";
import { deleteByIds, executeFuzzySearch, rememberMemory } from "@/lib/utils";

//* load configs
const GEMINI_API_KEY = env.GEMINI_API_KEY;
const SERVER_SECRET = env.SERVER_SECRET;
const DB_PATH = env.DB_PATH;
const MODEL_ID = env.MODEL_ID || "gemini-2.0-flash";

if (!GEMINI_API_KEY || !SERVER_SECRET) {
  throw new Error("Missing GEMINI_API_KEY or SERVER_SECRET in environment");
}

import { geminiJson, geminiText } from "@/lib/ai";

await initDb(DB_PATH);

const app = new Elysia().onBeforeHandle(({ request, set }) => {
  const serverSecret = request.headers.get("x-server-secret");
  if (!serverSecret) {
    set.status = 401;
    return { error: "Missing X-Api-Key" };
  }
  if (serverSecret !== SERVER_SECRET) {
    set.status = 403;
    return { error: "Unauthorized" };
  }
});

app.get("/", () => {
  return { message: "hello" };
});

app.post(
  "/remember",
  async ({ body, set }) => {
    try {
      const prompt = `Generate 5 search tags for this thought.\nInput: "${body.text}"\nFormat: JSON { "tags": ["tag1", "tag2"] }`;
      const json = await geminiJson<{ tags?: unknown[] }>(prompt);
      const tags: string[] = Array.isArray(json?.tags)
        ? json.tags.filter((t: unknown) => typeof t === "string")
        : [];

      const record = await rememberMemory(body.text, tags);
      return { ok: true, record, tags };
    } catch (e) {
      console.error("/remember failed", e);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  },
  {
    body: t.Object({
      text: t.String(),
    }),
  }
);

app.post(
  "/remind",
  async ({ body, set }) => {
    try {
      const keywordPrompt = `User Query: "${body.question}"\nExtract 3-5 keywords to search the database.\nFormat: JSON { "keywords": ["word1", "word2"] }`;
      const json = await geminiJson<{ keywords?: unknown[] }>(keywordPrompt);
      const keywords: string[] = Array.isArray(json?.keywords)
        ? json.keywords.filter((k: unknown) => typeof k === "string")
        : body.question.split(/\s+/).filter(Boolean).slice(0, 5);

      const rows = await executeFuzzySearch(keywords);

      const contextStr = rows
        .map((r) => `[ID:${r.id}] [${r.timestamp}] ${r.raw_text}`)
        .join("\n");

      const answerPrompt = `You are a Memory Assistant.\nUser Query: "${
        body.question
      }"\n\nRelevant Memories:\n${
        contextStr || "(none)"
      }\n\nTask:\n1. Answer the question using ONLY the memories above.\n2. If no relevant memories found, say "No relevant info found."`;

      const answer = await geminiText(answerPrompt);

      return {
        ok: true,
        answer,
        stats: { found: rows.length, keywords },
        rows,
      };
    } catch (e) {
      console.error("/remind failed", e);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  },
  {
    body: t.Object({
      question: t.String(),
    }),
  }
);

app.post(
  "/delete",
  async ({ body, set }) => {
    try {
      const keywords = body.question.split(/\s+/).filter(Boolean).slice(0, 8);
      const rows = await executeFuzzySearch(keywords);

      if (!rows.length) return { ok: true, answer: "No items found." };

      const options = rows
        .map((r) => `ID:${r.id} Text:${r.raw_text}`)
        .join("\n");
      const prompt = `User wants to delete: "${body.question}"\nWhich IDs match?\nOptions:\n${options}\nReturn JSON { "ids": [1] } or { "ids": [] }`;

      const json = await geminiJson<{ ids?: unknown[] }>(prompt);
      const ids: number[] = Array.isArray(json?.ids)
        ? json.ids.filter((n: unknown) => typeof n === "number")
        : [];

      if (!ids.length) {
        return {
          ok: true,
          answer: "Found items, but none matched exactly.",
          rows,
        };
      }

      const deleted = await deleteByIds(ids);
      return { ok: true, answer: `Deleted ${deleted.length} items.`, deleted };
    } catch (e) {
      console.error("/delete failed", e);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  },
  {
    body: t.Object({
      question: t.String(),
    }),
  }
);

app.listen(3000);
console.log("🐦‍⬛ raven is up at 3000");
