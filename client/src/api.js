// All calls to our server live here. Every helper returns the parsed JSON
// on success, or throws an Error whose message is safe to show the user.
//
// Mock mode (npm run dev:mock) swaps in fake responses from mockApi.js,
// so the UI can be built without the server or an API key.
import * as mock from "./mockApi.js";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

async function post(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the server. Is it running on port 3001?");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status}).`);
    // 503 = AI busy, 504 = AI too slow. The UI shows a friendlier notice for these.
    err.busy = res.status === 503 || res.status === 504;
    throw err;
  }
  return data;
}

// setup: { role, interviewType, style, numQuestions, jobDescription, resumeText }
// returns: { question }
export function startInterview(setup) {
  if (USE_MOCK) return mock.startInterview(setup);
  return post("/api/start", setup);
}

// history: [{ role: "model" | "user", text }], ending with the user's latest answer
// returns: { question }
export function submitAnswer(setup, history) {
  if (USE_MOCK) return mock.submitAnswer(setup, history);
  return post("/api/answer", { ...setup, history });
}

// history: the full interview, ending with the user's last answer
// returns: {
//   overallScore: 1-10, summary, strengths: [], improvements: [],
//   perQuestion: [{ question, scores: [{ criterion, score: 1-5, note }], tip }]
// }
export function getFeedback(setup, history) {
  if (USE_MOCK) return mock.getFeedback(setup, history);
  return post("/api/feedback", { ...setup, history });
}
