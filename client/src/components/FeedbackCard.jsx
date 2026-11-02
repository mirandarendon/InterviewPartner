// Shows the evaluator's feedback. It only displays data; App does the fetching.
// answers: the user's answers in order, shown under each question.
export default function FeedbackCard({ feedback, answers, setup, onStartOver }) {
  return (
    <div className="feedback">
      {/* Report card banner */}
      <section className="report">
        <div className="score-ring" role="img" aria-label={`Overall score ${feedback.overallScore} out of 10`}>
          <span className="score-number">{feedback.overallScore}</span>
          <span className="score-label">out of 10</span>
        </div>
        <div className="report-text">
          <p className="report-eyebrow">
            {setup.role} · {setup.interviewType}
          </p>
          <h1>{headline(feedback.overallScore)}</h1>
          <p className="report-summary">{feedback.summary}</p>
        </div>
      </section>

      {/* Strengths / improvements */}
      <div className="two-col">
        <section className="card list-card">
          <h2>
            <span className="icon-chip good">
              <CheckIcon />
            </span>
            What went well
          </h2>
          <ul>
            {feedback.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
        <section className="card list-card">
          <h2>
            <span className="icon-chip">
              <UpIcon />
            </span>
            Level up next time
          </h2>
          <ul>
            {feedback.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* Question by question */}
      <section className="questions">
        <h2>Question by question</h2>
        {feedback.perQuestion.map((q, i) => (
          // <details> is a built-in collapsible box. The first one starts open.
          <details key={i} className="question-row" open={i === 0}>
            <summary>
              <span className="q-number">Q{i + 1}</span>
              <span className="q-text">{q.question}</span>
              <span className="q-score">{average(q.scores)} / 5</span>
            </summary>

            {answers[i] && (
              <blockquote className="your-answer">
                <strong>Your answer</strong>
                {answers[i]}
              </blockquote>
            )}

            <div className="rubric">
              {q.scores.map((c) => (
                <div key={c.criterion} className="rubric-row">
                  <span className="criterion">{c.criterion}</span>
                  <Dots score={c.score} />
                  <span className="note">{c.note}</span>
                </div>
              ))}
            </div>

            <div className="try-this">
              <BulbIcon />
              <p>
                <strong>Try this:</strong> {q.tip}
              </p>
            </div>
          </details>
        ))}
      </section>

      <div className="center-actions">
        <button className="primary" onClick={onStartOver}>
          Start over
        </button>
      </div>
    </div>
  );
}

// Five dots, filled up to the score: ●●●●○
function Dots({ score }) {
  return (
    <span className="dots-meter" role="img" aria-label={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= score ? "filled" : ""} />
      ))}
    </span>
  );
}

// A friendly title for the banner based on the overall score.
function headline(score) {
  if (score >= 8) return "Great interview, you're ready!";
  if (score >= 5) return "Nice work, that was a solid round.";
  return "Good practice. Let's level up.";
}

// Average of the criterion scores, rounded to one decimal (e.g. 3.5).
function average(scores) {
  const total = scores.reduce((sum, c) => sum + c.score, 0);
  return (total / scores.length).toFixed(1);
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

function UpIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  );
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
