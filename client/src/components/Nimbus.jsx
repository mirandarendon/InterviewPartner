// Nimbus, the cloud mascot / interviewer. Pure SVG, no image files.
// size: width in px. sparkles: adds the little stars around it.
// sleepy: closed eyes and a "z", for the "AI is busy" notice.
export default function Nimbus({ size = 44, sparkles = false, sleepy = false, label }) {
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
      {sleepy ? (
        <>
          <path d="M51 50 q5 4 10 0" fill="none" stroke="var(--navy)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M71 50 q5 4 10 0" fill="none" stroke="var(--navy)" strokeWidth="3.5" strokeLinecap="round" />
          <text x="98" y="22" fontSize="18" fontWeight="800" fill="var(--sky-300)" fontFamily="var(--font-display)">z</text>
          <text x="108" y="10" fontSize="12" fontWeight="800" fill="var(--sky-300)" fontFamily="var(--font-display)">z</text>
        </>
      ) : (
        <>
          <circle cx="56" cy="50" r="4" fill="var(--navy)" />
          <circle cx="76" cy="50" r="4" fill="var(--navy)" />
        </>
      )}
      <ellipse cx="48" cy="58" rx="5" ry="3" fill="var(--periwinkle)" />
      <ellipse cx="84" cy="58" rx="5" ry="3" fill="var(--periwinkle)" />
      {sleepy ? (
        <ellipse cx="66" cy="62" rx="3.5" ry="2.5" fill="var(--navy)" />
      ) : (
        <path d="M61 59 q5 5 10 0" fill="none" stroke="var(--navy)" strokeWidth="3.5" strokeLinecap="round" />
      )}
      {sparkles && (
        <>
          <path d="M104 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="var(--butter)" />
          <path d="M14 22 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" fill="var(--sky-300)" />
        </>
      )}
    </svg>
  );
}
