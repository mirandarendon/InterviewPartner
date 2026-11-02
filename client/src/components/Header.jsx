import Nimbus from "./Nimbus.jsx";

const STEPS = [
  { stage: "setup", label: "1 · Setup" },
  { stage: "interview", label: "2 · Interview" },
  { stage: "feedback", label: "3 · Feedback" },
];

// Logo on the left, step tracker on the right. The current stage is highlighted.
export default function Header({ stage }) {
  return (
    <header className="header">
      <div className="logo">
        <Nimbus size={44} />
        <span>Interview Partner</span>
      </div>
      <ol className="steps" aria-label="Progress">
        {STEPS.map((s) => (
          <li key={s.stage} className={s.stage === stage ? "active" : ""} aria-current={s.stage === stage ? "step" : undefined}>
            {s.label}
          </li>
        ))}
      </ol>
    </header>
  );
}
