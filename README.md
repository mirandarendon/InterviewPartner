# Interview Partner

An AI mock interview coach. Enter the role, paste the job description, and upload your resume (PDF). An AI interviewer asks tailored questions one at a time, then a separate AI evaluator scores each answer against a rubric and gives specific tips.

Built for CS4680 Prompt Engineering.

## How it works

```
React (Vite) ──► Express server ──► Gemini API
   UI, PDF         prompts,           interviewer +
   reading         validation,        evaluator
                   rate limit
```

- **The resume never leaves the browser as a file.** `pdf.js` extracts the text in the browser, and only the text is sent.
- **The server is stateless.** The client sends the full conversation with every request.
- **The API key stays on the server.** It's read from `server/.env` locally, or from environment variables when deployed.

## Prompt engineering

All prompts live in [`server/prompts.js`](server/prompts.js). Two separate prompts use four patterns:

| Prompt | Pattern | Purpose |
|---|---|---|
| Interviewer | **Persona** | Experienced hiring manager; friendly / neutral / tough moods change the tone |
| Interviewer | **Flipped interaction** | The AI leads, one question at a time, tailored to the resume and job description |
| Evaluator | **Structured output with rubric** | Scores each answer 1–5 on named criteria (STAR, Specificity, Impact, Relevance for behavioral; Correctness, Depth, Clarity, Relevance for technical) and returns JSON |
| Evaluator | **Few-shot calibration** | A weak and a strong example answer with expected scores keep grading strict and consistent |

The interviewer never reveals scores; only the evaluator judges. Resume and job description text are wrapped in tags and treated as data, which protects against prompt injection.

## Run locally

Requires Node.js 22.9+ and a Gemini API key from [Google AI Studio](https://aistudio.google.com).

```bash
# 1. Server
cd server
cp .env.example .env        # then paste your key into .env
npm install
npm run dev                 # http://localhost:3001

# 2. Client (second terminal)
cd client
npm install
npm run dev                 # open the URL it prints (usually http://localhost:5173)
```

**Mock mode** runs the whole UI with fake AI responses, with no server or key needed:

```bash
cd client && npm run dev:mock
```

In mock mode, type `error` or `busy` as the role or an answer to preview the error states.

## Deploy (Render)

The server also serves the built website, so it's a single service.

1. Push the repo to GitHub. `server/.env` is git-ignored; never commit it.
2. On [render.com](https://render.com): **New → Web Service**, then connect the repo.
3. Settings:
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
4. **Environment** tab: add
   - `GEMINI_API_KEY`: your key
   - `GEMINI_MODEL`: `gemini-3.8-flash`
   - optional `RATE_LIMIT_PER_HOUR`: AI requests per visitor per hour (default 30)
5. Deploy. Render sets `PORT` automatically.

On Render's free plan the service sleeps after about 15 minutes idle, and the first visit afterwards takes up to a minute. Open the site a few minutes before a demo.

## Limits and safeguards

- **Rate limit:** 30 AI requests per visitor per hour. One interview uses about 7.
- **Timeouts:** each AI call gives up after 25 seconds (2 tries max). A busy model shows a friendly "try again" notice instead of hanging.
- **Input caps:** resume and job description up to 15,000 characters; answers up to 5,000 characters.
- **Feedback validation:** the evaluator's JSON is checked and cleaned before it reaches the UI.
