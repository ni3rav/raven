import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

const GEMINI_API_KEY = env.GEMINI_API_KEY;
const MODEL_ID = env.MODEL_ID || "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_ID });

export async function geminiText(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.text() ?? "";
}

export async function geminiJson<T = unknown>(prompt: string): Promise<T> {
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });
  const text = result.response.text();
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error(`Failed to parse Gemini JSON: ${text}`);
  }
}
