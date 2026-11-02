// Fake versions of the functions in api.js, for building the UI without
// calling the AI. Same inputs, same outputs, same kinds of errors.

const QUESTIONS = {
  behavioral: [
    "Tell me about a time you disagreed with a teammate. How did you handle it?",
    "Describe a project that didn't go as planned. What did you learn?",
    "Tell me about a time you had to learn something new quickly.",
    "Describe a situation where you took the lead without being asked.",
    "Tell me about a time you received critical feedback. What did you do with it?",
  ],
  technical: [
    "How would you explain the difference between props and state in React?",
    "Walk me through how you would debug a page that loads slowly.",
    "What happens between typing a URL into the browser and the page appearing?",
    "How would you make a form accessible to screen reader users?",
    "When would you choose a SQL database over a NoSQL one?",
  ],
  mixed: [
    "Tell me about a technical decision you made that you'd change today.",
    "How do you keep your skills current, and what have you learned recently?",
    "Describe a bug that took you a long time to find. How did you track it down?",
    "Tell me about a time you explained a technical idea to a non-technical person.",
    "How do you decide when code is good enough to ship?",
  ],
};

// Waits a moment so loading states are visible, like a real request.
function delay(ms = 800) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Picks a random question of the right type that hasn't been asked yet.
function nextQuestion(interviewType, history) {
  const asked = history.filter((m) => m.role === "model").map((m) => m.text);
  const remaining = QUESTIONS[interviewType].filter((q) => !asked.includes(q));
  const pool = remaining.length ? remaining : QUESTIONS[interviewType];
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function startInterview(setup) {
  await delay();
  // Type "error" as the role to see how the UI shows a failure.
  if (setup.role.trim().toLowerCase() === "error") {
    throw new Error("Mock error: this is what a server error looks like.");
  }
  return { question: nextQuestion(setup.interviewType, []) };
}

// Fake rubric criteria. In the real app these come from the evaluator prompt.
const CRITERIA = {
  behavioral: ["Structure (STAR)", "Specificity", "Impact", "Relevance"],
  technical: ["Correctness", "Depth", "Clarity", "Relevance"],
  mixed: ["Structure", "Specificity", "Clarity", "Relevance"],
};

// Turns history into [{ question, answer }] pairs.
function toPairs(history) {
  const pairs = [];
  history.forEach((m, i) => {
    if (m.role === "model" && history[i + 1]?.role === "user") {
      pairs.push({ question: m.text, answer: history[i + 1].text });
    }
  });
  return pairs;
}

// Fake scores based on answer length, so short answers visibly score lower.
function fakeScore(answer) {
  const words = answer.trim().split(/\s+/).length;
  if (words < 10) return 2;
  if (words < 30) return 3;
  if (words < 60) return 4;
  return 5;
}

export async function getFeedback(setup, history) {
  await delay(1200);
  const pairs = toPairs(history);
  if (pairs.some((p) => p.answer.trim().toLowerCase() === "feedback error")) {
    throw new Error("Mock error: feedback couldn't be generated.");
  }

  const perQuestion = pairs.map(({ question, answer }) => {
    const base = fakeScore(answer);
    return {
      question,
      scores: CRITERIA[setup.interviewType].map((criterion, i) => ({
        criterion,
        // Vary scores a little between criteria, kept within 1-5.
        score: Math.max(1, Math.min(5, base + (i % 2 === 0 ? 0 : -1))),
        note: base >= 4 ? "Clear and well supported." : "Add a concrete example or detail here.",
      })),
      tip:
        base >= 4
          ? "Strong answer. Close with one sentence linking it back to this role."
          : "Expand with a specific situation, what you did, and a measurable result.",
    };
  });

  const avg = perQuestion.reduce((sum, q) => sum + q.scores.reduce((s, c) => s + c.score, 0) / q.scores.length, 0);
  return {
    overallScore: Math.round((avg / perQuestion.length) * 2), // 1-5 scale -> 1-10
    summary: "Mock summary: you communicated clearly. Longer, more specific answers scored higher.",
    strengths: ["Stayed on topic", "Professional tone"],
    improvements: ["Quantify your results", "Use the STAR structure consistently"],
    perQuestion,
  };
}

export async function submitAnswer(setup, history) {
  await delay();
  // Answer "error" to see how the chat shows a failure.
  const lastAnswer = history[history.length - 1].text;
  if (lastAnswer.trim().toLowerCase() === "error") {
    throw new Error("Mock error: the next question couldn't be loaded.");
  }
  return { question: nextQuestion(setup.interviewType, history) };
}
