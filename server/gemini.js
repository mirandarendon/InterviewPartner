// Thin wrapper around the Gemini API. Every route calls generate() so that
// error handling lives in one place.
import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new UserFacingError("Server is missing GEMINI_API_KEY. Add it to server/.env and restart.", 500);
  }
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

// An error whose message is safe to show to the user.
export class UserFacingError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

// systemPrompt: instructions for the model (who it is, what to do)
// messages: [{ role: "user" | "model", text: "..." }]
export async function generate(systemPrompt, messages) {
  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      config: { systemInstruction: systemPrompt },
    });
    return response.text;
  } catch (err) {
    if (err instanceof UserFacingError) throw err;
    console.error("Gemini error:", err.status, err.message);
    if (err.status === 429) {
      throw new UserFacingError("Rate limit reached. Wait about a minute and try again.", 429);
    }
    if (err.status === 404) {
      throw new UserFacingError(`Model "${MODEL}" was not found. Check GEMINI_MODEL in server/.env.`, 502);
    }
    if (err.status === 400 || err.status === 403) {
      throw new UserFacingError("Gemini rejected the request. Check that your API key is valid.", 502);
    }
    throw new UserFacingError("The AI service had a problem. Please try again.", 502);
  }
}
