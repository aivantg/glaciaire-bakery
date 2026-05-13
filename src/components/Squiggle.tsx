/**
 * Hand-drawn wavy double-line divider, used after section labels like "DRINKS".
 */
export function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M2 18 Q70 4 160 18 T320 18 T480 18 T640 18 T796 14"
        stroke="#2e7acc"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M2 28 Q70 16 160 28 T320 28 T480 28 T640 28 T796 26"
        stroke="#9fc4f5"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
