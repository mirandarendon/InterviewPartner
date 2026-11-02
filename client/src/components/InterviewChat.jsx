import { useEffect, useRef, useState } from "react";
import { submitAnswer } from "../api.js";
import Nimbus from "./Nimbus.jsx";
import ErrorNotice from "./ErrorNotice.jsx";

// Shows the conversation and an answer box. After the last answer,
// calls onFinished instead of asking for another question.
export default function InterviewChat({ setup, history, setHistory, onFinished, onLeave }) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const total = Number(setup.numQuestions);
  const answered = history.filter((m) => m.role === "user").length;
  const current = Math.min(answered + 1, total);
  const isLast = answered + 1 >= total;

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [history, loading]);

  // e is missing when called from the Try again button.
  async function handleSubmit(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || loading) return;

    const before = history;
    const withAnswer = [...history, { role: "user", text }];
    setHistory(withAnswer);
    setDraft("");
    setError(null);

    // That was the last question: hand off to feedback.
    if (isLast) {
      onFinished(withAnswer);
      return;
    }

    setLoading(true);
    try {
      const { question } = await submitAnswer(setup, withAnswer);
      setHistory([...withAnswer, { role: "model", text: question }]);
    } catch (err) {
      // Undo so the user can try sending the same answer again.
      setHistory(before);
      setDraft(text);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  // Cmd+Enter (Mac) or Ctrl+Enter submits; plain Enter makes a new line.
  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
  }

  return (
    <div className="interview">
      {/* Sidebar: session info + tip */}
      <aside className="sidebar">
        <section className="card session">
          <h2>Your session</h2>
          <p className="session-role">{setup.role}</p>
          <div className="tags">
            <span className="tag">{capitalize(setup.interviewType)}</span>
            <span className="tag">{capitalize(setup.style)}</span>
          </div>
          <hr />
          <p className="session-count">
            Question {current} of {total}
          </p>
          <div className="progress" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={i < current ? "done" : ""} />
            ))}
          </div>
        </section>

        <section className="tip-card">
          <BulbIcon />
          <p>
            <strong>Quick tip:</strong> try the STAR shape: Situation, Task, Action, Result. End on what changed.
          </p>
        </section>

        <button type="button" className="link-button muted-link" onClick={onLeave}>
          Leave interview
        </button>
      </aside>

      {/* Chat */}
      <section className="card chat-card" aria-label="Interview chat">
        <div className="chat">
          {history.map((m, i) =>
            m.role === "model" ? (
              <div key={i} className="message interviewer">
                <Nimbus size={44} />
                <div className="bubble">
                  <strong className="speaker">Nimbus</strong>
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="message candidate">
                <div className="bubble">
                  <strong className="speaker">You</strong>
                  {m.text}
                </div>
              </div>
            )
          )}
          {loading && <Thinking />}
          <div ref={bottomRef} />
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          {/* Your answer is put back in the box, so Try again just resends it. */}
          <ErrorNotice error={error} onRetry={() => handleSubmit()} />
          <label className="field">
            Your answer
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              placeholder="Take your time. Type your answer here…"
              disabled={loading}
            />
          </label>
          <div className="form-actions">
            <span className="hint">Cmd/Ctrl + Enter to send</span>
            <button type="submit" className="primary" disabled={loading || !draft.trim()}>
              {isLast ? "Send final answer" : "Send answer"}
              <SendIcon />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// The bouncing "Nimbus is thinking…" dots. Also used on the feedback loading screen.
export function Thinking({ text = "Nimbus is thinking…" }) {
  return (
    <div className="thinking" role="status">
      <span className="dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>{text}</span>
    </div>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function BulbIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l16-8-6 16-3-7z" />
    </svg>
  );
}
