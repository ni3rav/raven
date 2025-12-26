const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SERVER_SECRET = process.env.SERVER_SECRET;
const DB_PATH = process.env.DB_PATH;
const MODEL_ID = process.env.MODEL_ID;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

if (!SERVER_SECRET) {
  throw new Error("SERVER_SECRET environment variable is not set");
}

if (!DB_PATH) {
  throw new Error("DB_PATH environment variable is not set");
}

if (!MODEL_ID) {
  throw new Error("MODEL_ID environment variable is not set");
}

export const env = {
  GEMINI_API_KEY,
  SERVER_SECRET,
  DB_PATH,
  MODEL_ID
};
