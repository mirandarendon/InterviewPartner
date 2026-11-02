import { useState } from "react";
import { startInterview } from "../api.js";
import Nimbus from "./Nimbus.jsx";
import ResumeUpload from "./ResumeUpload.jsx";

// Fake data for quick testing. No real personal info.
const SAMPLE = {
  role: "Junior Frontend Developer",
  jobDescription:
    "Acme Widgets is hiring a Junior Frontend Developer to build and maintain React components, " +
    "work with designers on accessible UI, write unit tests, and collaborate in code reviews. " +
    "Familiarity with JavaScript, HTML/CSS, and Git is required.",
};

const SAMPLE_RESUME = {
  name: "sample-resume.pdf",
  text: `Alex Sample
Computer Science student, State University (expected 2027)

EXPERIENCE
Web Developer Intern, Example Labs (Summer 2025)
- Built 6 React components for an internal dashboard
- Cut page load time by 30% by lazy-loading charts

PROJECTS
Study Buddy: a React + Node app that matches classmates for study sessions
- Led a team of 3; shipped in 5 weeks

SKILLS
JavaScript, React, HTML/CSS, Node.js, Git, SQL`,
};

const TYPES = [
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "mixed", label: "Mixed" },
];

const STYLES = [
  { value: "friendly", label: "Friendly" },
  { value: "neutral", label: "Neutral" },
  { value: "tough", label: "Tough" },
];

export default function SetupForm({ onStarted }) {
  const [form, setForm] = useState({
    role: "",
    interviewType: "behavioral",
    style: "friendly",
    numQuestions: 5,
    jobDescription: "",
    resume: null, // { name, text } once a PDF is read
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Updates one field of the form by name.
  function update(name, value) {
    setForm({ ...form, [name]: value });
  }

  // Keeps the question count between 1 and 10.
  function changeCount(by) {
    update("numQuestions", Math.min(10, Math.max(1, form.numQuestions + by)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // The server only needs the resume text, not the file name.
    const setup = { ...form, resume: undefined, resumeText: form.resume?.text || "" };
    try {
      const { question } = await startInterview(setup);
      onStarted(setup, question);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="setup">
      {/* Left: welcome + mascot */}
      <section className="hero">
        <p className="eyebrow">Mock interview practice</p>
        <h1>
          Let's get you <span className="squiggle">interview‑ready</span>.
        </h1>
        <p className="lead">
          Tell us about the role. You'll get a friendly practice interview, one question at a time, and honest feedback
          at the end.
        </p>
        <div className="greeting">
          <Nimbus size={132} sparkles label="Nimbus, a smiling cloud" />
          <p className="speech">
            <strong>Nimbus</strong>
            Hi! I'll be your interviewer today. No pressure, it's just practice.
          </p>
        </div>
      </section>

      {/* Right: the form */}
      <form className="card setup-form" onSubmit={handleSubmit}>
        <h2>Set up your interview</h2>

        <label className="field">
          Role
          <input
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            placeholder="e.g. Software Engineer Intern"
            required
          />
        </label>

        <label className="field">
          <span>
            Job description <span className="hint">Optional, but it makes questions sharper</span>
          </span>
          <textarea
            value={form.jobDescription}
            onChange={(e) => update("jobDescription", e.target.value)}
            rows={4}
            placeholder="Paste the job posting here"
          />
        </label>

        <ResumeUpload resume={form.resume} onChange={(resume) => update("resume", resume)} />

        <fieldset>
          <legend>Interview type</legend>
          <div className="pills">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className="pill"
                aria-pressed={form.interviewType === t.value}
                onClick={() => update("interviewType", t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="setup-row">
          <fieldset>
            <legend>Interviewer mood</legend>
            <div className="pills">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className="pill soft"
                  aria-pressed={form.style === s.value}
                  onClick={() => update("style", s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Questions</legend>
            <div className="stepper">
              <button type="button" aria-label="Fewer questions" onClick={() => changeCount(-1)} disabled={form.numQuestions <= 1}>
                –
              </button>
              <span aria-live="polite">{form.numQuestions}</span>
              <button type="button" aria-label="More questions" onClick={() => changeCount(1)} disabled={form.numQuestions >= 10}>
                +
              </button>
            </div>
          </fieldset>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="link-button" onClick={() => setForm({ ...form, ...SAMPLE, resume: SAMPLE_RESUME })}>
            Fill sample data
          </button>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? "Starting..." : "Start interview"}
            {!loading && <ArrowIcon />}
          </button>
        </div>
      </form>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
