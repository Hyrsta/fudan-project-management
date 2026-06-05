import type { JSX } from "react";

import type { PersonaLensId } from "../../types";

type GlyphProps = { value: PersonaLensId; color?: string };

export function PersonaGlyph({ value, color }: GlyphProps) {
  const c = color || "currentColor";
  const map: Record<PersonaLensId, JSX.Element> = {
    research_analyst: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="1.5" width="8" height="11" rx="1.5" stroke={c} strokeWidth="1.4" />
        <path d="M4 4.5h4M4 7h3" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="10" cy="10.5" r="2" stroke={c} strokeWidth="1.4" />
      </svg>
    ),
    financial_analyst: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <path
          d="M2 11l3-4 3 2 4-6"
          stroke={c}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12 4v3h-3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    executive_brief: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <rect x="1.5" y="4" width="11" height="8" rx="1.4" stroke={c} strokeWidth="1.4" />
        <path d="M5 4V2.5h4V4" stroke={c} strokeWidth="1.4" />
        <path d="M1.5 8h11" stroke={c} strokeWidth="1.4" />
      </svg>
    ),
    policy_intelligence: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <path d="M7 2l5 2H2l5-2z" fill={c} />
        <path d="M3 5v6M11 5v6M5.5 5v6M8.5 5v6" stroke={c} strokeWidth="1.2" />
        <path d="M2 12h10" stroke={c} strokeWidth="1.4" />
      </svg>
    ),
    academic_researcher: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <path d="M1 5l6-2.5 6 2.5-6 2.5L1 5z" stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
        <path
          d="M3.5 6.5v3c0 .8 1.6 1.5 3.5 1.5s3.5-.7 3.5-1.5v-3"
          stroke={c}
          strokeWidth="1.4"
        />
      </svg>
    ),
    risk_analyst: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <path
          d="M7 1.5L1.5 4v3.5c0 3 2.5 5 5.5 5s5.5-2 5.5-5V4L7 1.5z"
          stroke={c}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M7 5v3M7 9.8v.2" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };
  return map[value] || map.research_analyst;
}

export type RailIconKind = "search" | "bookmark" | "radio";

export function RailIcon({ kind }: { kind: RailIconKind }) {
  const c = "currentColor";
  const map: Record<RailIconKind, JSX.Element> = {
    search: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="6" cy="6" r="4" stroke={c} strokeWidth="1.4" />
        <path d="M9 9l3 3" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    bookmark: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3.5 2h7v10l-3.5-2.2L3.5 12V2z" stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
    radio: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="1.4" fill={c} />
        <path
          d="M4.2 4.2c-1.5 1.5-1.5 4.1 0 5.6M9.8 4.2c1.5 1.5 1.5 4.1 0 5.6M2.6 2.6c-2.4 2.4-2.4 6.4 0 8.8M11.4 2.6c2.4 2.4 2.4 6.4 0 8.8"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    ),
  };
  return map[kind];
}
