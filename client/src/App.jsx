import { useState } from "react";
import Header from "./components/Header.jsx";
import SetupForm from "./components/SetupForm.jsx";
import InterviewChat, { Thinking } from "./components/InterviewChat.jsx";
import FeedbackCard from "./components/FeedbackCard.jsx";
import Nimbus from "./components/Nimbus.jsx";
import { USE_MOCK, getFeedback } from "./api.js";

// App decides which screen to show. Stages:
//   "setup"     -> the setup form
//   "interview" -> the chat, one question at a time
//   "feedback"  -> the evaluator's feedback
export default function App() {
  const [stage, setStage] = useState("setup");
  const [setup, setSetup] = useState(null);
  // The whole conversation, in the same shape the server uses:
  // [{ role: "model", text: question }, { role: "user", text: answer }, ...]
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [feedbackError, setFeedbackError] = useState("");

  function handleStarted(setupData, firstQuestion) {
    setSetup(setupData);
    setHistory([{ role: "model", text: firstQuestion }]);
    setStage("interview");
  }

  function handleFinished(finalHistory) {
    setHistory(finalHistory);
    setStage("feedback");
    loadFeedback(finalHistory);
  }

  // Fetched here (not inside FeedbackCard) so it runs exactly once per interview.
  async function loadFeedback(finalHistory) {
    setFeedback(null);
    setFeedbackError("");
    try {
      setFeedback(await getFeedback(setup, finalHistory));
    } catch (err) {
      setFeedbackError(err.message);
    }
  }

  function startOver() {
    setHistory([]);
    setFeedback(null);
    setFeedbackError("");
    setStage("setup");
  }

  const answers = history.filter((m) => m.role === "user").map((m) => m.text);

  return (
    <>
      <Header stage={stage} />
      <main className="container">
        {USE_MOCK && <p className="mock-badge">Mock mode: AI responses are fake</p>}

        {stage === "setup" && <SetupForm onStarted={handleStarted} />}

        {stage === "interview" && (
          <InterviewChat
            setup={setup}
            history={history}
            setHistory={setHistory}
            onFinished={handleFinished}
            onLeave={startOver}
          />
        )}

        {stage === "feedback" && feedback && (
          <FeedbackCard feedback={feedback} answers={answers} setup={setup} onStartOver={startOver} />
        )}

        {stage === "feedback" && !feedback && (
          <section className="card waiting">
            <Nimbus size={110} sparkles />
            {feedbackError ? (
              <>
                <p className="error">{feedbackError}</p>
                <div className="center-actions">
                  <button className="secondary" onClick={startOver}>
                    Start over
                  </button>
                  <button className="primary" onClick={() => loadFeedback(history)}>
                    Try again
                  </button>
                </div>
              </>
            ) : (
              <Thinking text="Nimbus is reviewing your answers…" />
            )}
          </section>
        )}
      </main>
    </>
  );
}
