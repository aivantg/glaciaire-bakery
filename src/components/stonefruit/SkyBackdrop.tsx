import { WORLD_VH } from "./timing";

/** Soft sky gradient with hand-drawn clouds — fills the tall falling world. */
export function SkyBackdrop() {
  return (
    <svg
      className="absolute inset-x-0 top-0 w-full"
      viewBox={`0 0 390 ${WORLD_VH * 3.67}`}
      preserveAspectRatio="xMidYMin slice"
      aria-hidden
      style={{ height: `${WORLD_VH}vh` }}
    >
      <defs>
        <linearGradient id="sf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5BB4E0" />
          <stop offset="18%" stopColor="#7EC8EB" />
          <stop offset="42%" stopColor="#A9DDF2" />
          <stop offset="68%" stopColor="#D4EEF8" />
          <stop offset="88%" stopColor="#F0E2C8" />
          <stop offset="100%" stopColor="#E8D4A8" />
        </linearGradient>
        <radialGradient id="sf-sun" cx="76%" cy="8%" r="16%">
          <stop offset="0%" stopColor="#FFF4C2" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#FFE27A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFE27A" stopOpacity="0" />
        </radialGradient>
        <filter id="sf-cloud-soft" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <rect width="390" height={WORLD_VH * 3.67} fill="url(#sf-sky)" />
      <rect width="390" height={WORLD_VH * 3.67} fill="url(#sf-sun)" />

      {/* Cloud bands at different altitudes — parallax depth while falling */}
      <g filter="url(#sf-cloud-soft)" fill="#FFFFFF">
        <g opacity="0.78">
          <ellipse cx="72" cy="90" rx="48" ry="18" />
          <ellipse cx="98" cy="84" rx="28" ry="14" />
          <ellipse cx="52" cy="86" rx="22" ry="12" />
          <ellipse cx="250" cy="64" rx="56" ry="16" />
          <ellipse cx="278" cy="58" rx="30" ry="13" />
          <ellipse cx="320" cy="130" rx="44" ry="14" />
        </g>
        <g opacity="0.62">
          <ellipse cx="160" cy="220" rx="50" ry="14" />
          <ellipse cx="188" cy="214" rx="26" ry="11" />
          <ellipse cx="40" cy="280" rx="36" ry="12" />
          <ellipse cx="300" cy="260" rx="42" ry="13" />
        </g>
        <g opacity="0.48">
          <ellipse cx="120" cy="380" rx="54" ry="15" />
          <ellipse cx="148" cy="374" rx="28" ry="11" />
          <ellipse cx="280" cy="420" rx="46" ry="13" />
          <ellipse cx="60" cy="470" rx="38" ry="12" />
        </g>
        <g opacity="0.32">
          <ellipse cx="200" cy="560" rx="60" ry="16" />
          <ellipse cx="90" cy="620" rx="44" ry="13" />
          <ellipse cx="310" cy="600" rx="40" ry="12" />
        </g>
      </g>

      {/* Subtle paper grain */}
      <g opacity="0.05" stroke="#3A2A1A" strokeWidth="0.6">
        {Array.from({ length: 24 }).map((_, i) => (
          <path
            key={i}
            d={`M${12 + (i * 47) % 360} ${40 + (i * 97) % 700}c2-1 4 1 3 2s-3 1-4-1 0-2 1-1`}
            fill="none"
          />
        ))}
      </g>
    </svg>
  );
}
