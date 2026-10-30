import express from "express";
import { generate, UserFacingError } from "./gemini.js";
import { interviewerPrompt } from "./prompts.js";

const app = express();
app.use(express.json({ limit: "100kb" }));

const INTERVIEW_TYPES = ["behavioral", "technical", "mixed"];
const STYLES = ["friendly", "neutral", "tough"];

// Checks the setup form and fills in defaults. Throws a 400 if something is invalid.
function readSetup(body) {
  const setup = {
    role: String(body.role || "").trim(),
    interviewType: body.interviewType || "behavioral",
    style: body.style || "neutral",
    numQuestions: Number(body.numQuestions) || 5,
    jobDescription: String(body.jobDescription || "").trim(),
  };
  if (!setup.role) throw new UserFacingError("Please enter a role.", 400);
  if (!INTERVIEW_TYPES.includes(setup.interviewType)) throw new UserFacingError("Invalid interview type.", 400);
  if (!STYLES.includes(setup.style)) throw new UserFacingError("Invalid interviewer style.", 400);
  if (setup.numQuestions < 1 || setup.numQuestions > 10) throw new UserFacingError("Choose 1-10 questions.", 400);
  return setup;
}

// Setup options in, first question out.
app.post("/api/start", async (req, res, next) => {
  try {
    const setup = readSetup(req.body);
    const question = await generate(interviewerPrompt(setup), [
      { role: "user", text: "Begin the interview." },
    ]);
    res.json({ question: question.trim() });
  } catch (err) {
    next(err);
  }
});

// Sends every error to the client as { error: "message" }.
app.use((err, req, res, next) => {
  if (err instanceof UserFacingError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
