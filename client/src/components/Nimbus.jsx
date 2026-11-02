// Nimbus, the cloud mascot / interviewer. Pure SVG, no image files.
// size: width in px. sparkles: adds the little stars around it.
export default function Nimbus({ size = 44, sparkles = false, label }) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  return (
    <svg {...a11y} width={size} height={size * 0.72} viewBox="0 0 120 86" className="nimbus">
      <path
        d="M28 76 H94 a22 22 0 0 0 2-44 a30 30 0 0 0-56-8 a24 24 0 0 0-12 52z"
        fill="#FFFFFF"
        stroke="var(--navy)"
        strokeWidth={size < 80 ? 5 : 3.5}
        strokeLinejoin="round"
      />
      <circle cx="56" cy="50" r="4" fill="var(--navy)" />
      <circle cx="76" cy="50" r="4" fill="var(--navy)" />
      <ellipse cx="48" cy="58" rx="5" ry="3" fill="var(--periwinkle)" />
      <ellipse cx="84" cy="58" rx="5" ry="3" fill="var(--periwinkle)" />
      <path d="M61 59 q5 5 10 0" fill="none" stroke="var(--navy)" strokeWidth="3.5" strokeLinecap="round" />
      {sparkles && (
        <>
          <path d="M104 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="var(--butter)" />
          <path d="M14 22 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" fill="var(--sky-300)" />
        </>
      )}
    </svg>
  );
}
