import Elysia, { t } from "elysia";
import { env } from "@/lib/env";
import { initDb } from "@/db/db";
import { deleteByIds, executeFuzzySearch, rememberMemory } from "@/lib/utils";

//* load configs
const GEMINI_API_KEY = env.GEMINI_API_KEY;
const SERVER_SECRET = env.SERVER_SECRET;
const DB_PATH = env.DB_PATH;
const MODEL_ID = env.MODEL_ID;

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
      const record = await rememberMemory(body.raw_text, body.ai_tags);
      return { ok: true, record };
    } catch (e) {
      console.error("/remember failed", e);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  },
  {
    body: t.Object({
      raw_text: t.String(),
      ai_tags: t.Optional(t.Array(t.String())),
    }),
  }
);

app.post(
  "/remind",
  async ({ body, set }) => {
    try {
      const results = await executeFuzzySearch(body.keywords);
      return { ok: true, results };
    } catch (e) {
      console.error("/remind failed", e);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  },
  {
    body: t.Object({
      keywords: t.Array(t.String()),
    }),
  }
);

app.post(
  "/delete",
  async ({ body, set }) => {
    try {
      const deleted = await deleteByIds(body.ids);
      return { ok: true, deleted };
    } catch (e) {
      console.error("/delete failed", e);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  },
  {
    body: t.Object({
      ids: t.Array(t.Number()),
    }),
  }
);

app.listen(3000);
console.log("🦊 Elysia listening on http://localhost:3000");
