// Thin wrapper around the Gemini API. Every route calls generate() so that
// error handling lives in one place.
import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

// Without these, a busy model can make one request hang for minutes:
// the library retries up to 5 times by default and has no time limit.
const TIMEOUT_MS = 25_000; // per attempt
const ATTEMPTS = 2; // the first try + 1 retry

let client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new UserFacingError("Server is missing GEMINI_API_KEY. Add it to server/.env and restart.", 500);
  }
  client ??= new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { timeout: TIMEOUT_MS, retryOptions: { attempts: ATTEMPTS } },
  });
  return client;
}

// Gemini says it's overloaded with status 503 ("UNAVAILABLE").
function isBusy(err) {
  return err.status === 503 || /overloaded|unavailable/i.test(err.message);
}

// Our time limit ran out (AbortError), or Gemini's did (504 DEADLINE_EXCEEDED).
function isTimeout(err) {
  return (
    err.status === 504 ||
    err.name === "AbortError" ||
    err.name === "TimeoutError" ||
    /timed? ?out|aborted|deadline/i.test(err.message)
  );
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
// options.json: ask Gemini to reply with JSON only (used by the evaluator)
// options.maxTokens: hard limit on reply length
export async function generate(systemPrompt, messages, options = {}) {
  let response;
  try {
    response = await getClient().models.generateContent({
      model: MODEL,
      contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      config: {
        systemInstruction: systemPrompt,
        ...(options.json && { responseMimeType: "application/json" }),
        ...(options.maxTokens && { maxOutputTokens: options.maxTokens }),
      },
    });
  } catch (err) {
    if (err instanceof UserFacingError) throw err;
    console.error("Gemini error:", err.status, err.name, err.message);
    if (isBusy(err)) {
      throw new UserFacingError("The AI is busy right now. Please try again in a minute.", 503);
    }
    if (isTimeout(err)) {
      throw new UserFacingError("The AI took too long to respond. Please try again.", 504);
    }
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

  // An empty reply usually means the length cap was hit or a safety filter blocked it.
  if (!response.text) {
    console.error("Gemini returned no text. Finish reason:", response.candidates?.[0]?.finishReason);
    throw new UserFacingError("The AI didn't return a response. Please try again.", 502);
  }
  return response.text;
}
