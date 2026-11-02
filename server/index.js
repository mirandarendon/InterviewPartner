import express from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generate, UserFacingError } from "./gemini.js";
import { interviewerPrompt, evaluatorPrompt, evaluatorTranscript } from "./prompts.js";

const app = express();
// On Render (and most hosts) requests pass through a proxy; this makes
// req.ip the visitor's real address, which the rate limit relies on.
app.set("trust proxy", 1);
app.use(express.json({ limit: "200kb" }));

// Simple rate limit so a public link can't run up the Gemini bill.
// One interview is about 7 requests, so 30/hour allows several.
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_HOUR) || 30;
const HOUR = 60 * 60 * 1000;
const visitors = new Map(); // ip -> { count, resetAt }

app.use("/api", (req, res, next) => {
  const now = Date.now();
  let entry = visitors.get(req.ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + HOUR };
    visitors.set(req.ip, entry);
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) {
    const minutes = Math.ceil((entry.resetAt - now) / 60000);
    return res.status(429).json({ error: `You've hit the practice limit. Please try again in ${minutes} minutes.` });
  }
  next();
});

// Forget old visitors every hour so the map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of visitors) if (now > entry.resetAt) visitors.delete(ip);
}, HOUR).unref();

const INTERVIEW_TYPES = ["behavioral", "technical", "mixed"];
const STYLES = ["friendly", "neutral", "tough"];
const MAX_TEXT = 15000; // matches the client's resume limit
const MAX_ANSWER = 5000;

// Checks the setup form and fills in defaults. Throws a 400 if something is invalid.
function readSetup(body) {
  const setup = {
    role: String(body.role || "").trim(),
    interviewType: body.interviewType || "behavioral",
    style: body.style || "neutral",
    numQuestions: Number(body.numQuestions) || 5,
    jobDescription: String(body.jobDescription || "").trim().slice(0, MAX_TEXT),
    resumeText: String(body.resumeText || "").trim().slice(0, MAX_TEXT),
  };
  if (!setup.role) throw new UserFacingError("Please enter a role.", 400);
  if (!INTERVIEW_TYPES.includes(setup.interviewType)) throw new UserFacingError("Invalid interview type.", 400);
  if (!STYLES.includes(setup.style)) throw new UserFacingError("Invalid interviewer style.", 400);
  if (setup.numQuestions < 1 || setup.numQuestions > 10) throw new UserFacingError("Choose 1-10 questions.", 400);
  return setup;
}

// Checks the conversation the client sends: [{ role: "model" | "user", text }],
// starting with a question and ending with the candidate's answer.
function readHistory(body) {
  const history = body.history;
  const valid =
    Array.isArray(history) &&
    history.length >= 2 &&
    history.length <= 40 &&
    history.every((m) => (m?.role === "model" || m?.role === "user") && typeof m.text === "string") &&
    history[0].role === "model" &&
    history[history.length - 1].role === "user";
  if (!valid) throw new UserFacingError("The interview history is missing or invalid.", 400);
  return history.map((m) => ({ role: m.role, text: m.text.trim().slice(0, MAX_ANSWER) }));
}

// Gemini expects a conversation to start with the user, so every interviewer
// call begins with this kickoff message (the client never sees it).
const KICKOFF = { role: "user", text: "Begin the interview." };

// Setup options in, first question out.
app.post("/api/start", async (req, res, next) => {
  try {
    const setup = readSetup(req.body);
    const question = await generate(interviewerPrompt({ ...setup, questionNumber: 1 }), [KICKOFF]);
    res.json({ question: question.trim() });
  } catch (err) {
    next(err);
  }
});

// Setup + history (ending with an answer) in, next question out.
app.post("/api/answer", async (req, res, next) => {
  try {
    const setup = readSetup(req.body);
    const history = readHistory(req.body);
    const asked = history.filter((m) => m.role === "model").length;
    const question = await generate(interviewerPrompt({ ...setup, questionNumber: asked + 1 }), [KICKOFF, ...history]);
    res.json({ question: question.trim() });
  } catch (err) {
    next(err);
  }
});

// Setup + full history in, rubric feedback (JSON) out.
app.post("/api/feedback", async (req, res, next) => {
  try {
    const setup = readSetup(req.body);
    const history = readHistory(req.body);
    const raw = await generate(evaluatorPrompt(setup), [{ role: "user", text: evaluatorTranscript(history) }], {
      json: true,
    });
    const answered = history.filter((m) => m.role === "user").length;
    res.json(parseFeedback(raw, answered));
  } catch (err) {
    next(err);
  }
});

// Turns the evaluator's reply into the exact shape FeedbackCard expects.
// Models sometimes add ```json fences or drift slightly from the format,
// so we clean up what we can and reject what we can't.
function parseFeedback(raw, answered) {
  let data;
  try {
    data = JSON.parse(raw.trim().replace(/^```(json)?\s*/i, "").replace(/```$/, ""));
  } catch {
    console.error("Evaluator returned invalid JSON:", raw.slice(0, 500));
    throw new UserFacingError("The feedback came back in an unexpected format. Please try again.", 502);
  }

  const clamp = (n, min, max) => Math.min(max, Math.max(min, Math.round(Number(n)) || min));
  const strings = (list) => (Array.isArray(list) ? list.map(String).filter(Boolean) : []);

  const perQuestion = Array.isArray(data.perQuestion)
    ? data.perQuestion.map((q) => ({
        question: String(q?.question || ""),
        scores: (Array.isArray(q?.scores) ? q.scores : []).map((c) => ({
          criterion: String(c?.criterion || ""),
          score: clamp(c?.score, 1, 5),
          note: String(c?.note || ""),
        })),
        tip: String(q?.tip || ""),
      }))
    : [];

  if (!data.summary || perQuestion.length !== answered || perQuestion.some((q) => q.scores.length === 0)) {
    console.error("Evaluator returned an incomplete result:", raw.slice(0, 500));
    throw new UserFacingError("The feedback came back incomplete. Please try again.", 502);
  }

  return {
    overallScore: clamp(data.overallScore, 1, 10),
    summary: String(data.summary),
    strengths: strings(data.strengths),
    improvements: strings(data.improvements),
    perQuestion,
  };
}

// Unknown /api routes get a JSON 404 instead of the website.
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// In production, this server also serves the built React site (client/dist).
// In development Vite serves it instead, so this folder may not exist.
const SITE = fileURLToPath(new URL("../client/dist", import.meta.url));
if (existsSync(SITE)) {
  app.use(express.static(SITE));
  // Any other page loads index.html, so refreshing the browser works.
  app.use((req, res, next) => (req.method === "GET" ? res.sendFile("index.html", { root: SITE }) : next()));
}

// Sends every error to the client as { error: "message" }.
app.use((err, req, res, next) => {
  if (err instanceof UserFacingError) return res.status(err.status).json({ error: err.message });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "That's too much text. Try a shorter resume or job description." });
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
