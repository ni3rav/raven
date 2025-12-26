import Elysia from "elysia";
import { env } from "@/lib/env";
import { initDb } from "@/db/db";

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

app.listen(3000);
console.log("🦊 Elysia listening on http://localhost:3000");
