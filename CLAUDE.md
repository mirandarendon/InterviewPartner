# AI Interview Practice Partner (CS4680 Prompt Engineering)

React (Vite) client + stateless Node/Express server + Gemini (`@google/genai`).
The client sends the full history with every request.

## Working rules
- Build ONE small step at a time. Before each step, state the plan (files + why) and wait for OK.
- After each step, explain the code in plain language and how to test it.
- Never commit or push. The user does all git operations.
- ALL prompt templates and few-shot examples live in `server/prompts.js`.
- The user writes and tunes the prompts. Give a first draft, explain its structure, suggest experiments.
- Remind the user to log prompt changes that fix or break things in `PROMPT_LOG.md`.
- Only these 4 prompt patterns: Persona, Flipped interaction, Few-shot calibration, Structured output with rubric.
  Do not add other techniques without asking.
- Interviewer and evaluator are separate prompts. The interviewer never reveals scores.
- For decisions with tradeoffs, give two options + a recommendation.
- MVP: simple and readable, no unnecessary libraries. API key only in `server/.env`.
- No real personal info in sample data.

## Build order
1. Server scaffold + `/api/start` (plain text) · 1b. `/api/answer` (plain text)
2. Separate interviewer/evaluator prompts with JSON schemas
3. React UI: setup, chat, feedback card
4. Few-shot calibration + behavioral vs technical rubrics
5. Interviewer styles, final report, optional "try again"
6. Polish, README, deploy, demo prep

## Run
`cd server && npm install && npm run dev` (needs `server/.env`, see `.env.example`)
