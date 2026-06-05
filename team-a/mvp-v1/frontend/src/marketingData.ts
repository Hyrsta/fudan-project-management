// marketingData.ts: typed constants for the public marketing site.
// Ported verbatim from 项目管理/Website UIUX/prod/data.js — every value
// traces to team-a/mvp-v1 source (ranking.py, personas.py, auth.py,
// data/source_registry.json, artifacts/brief-a017839f67/brief.json).
// Update DEMO_BRIEF if artifacts/brief-a017839f67/brief.json changes.

import type {
  CoverageModeSpec,
  DemoBrief,
  PersonaLens,
  PipelineAgent,
  RankingSignal,
  RoleSpec,
} from "./types";

export const PRODUCT = {
  name: "News Intelligence Studio",
  tagline: "A local-first analyst workspace for source-ranked, persona-aware briefings.",
  edition: "Team A MVP",
  endpoint: "studio.localhost",
} as const;

// Six selectable personas: exactly what personas.get_persona_options() returns
// (market_watch is defined in personas.py but intentionally NOT selectable).
export const PERSONAS: PersonaLens[] = [
  {
    value: "research_analyst",
    label: "Research analyst",
    short: "Evidence, framing, and uncertainty.",
    focus: ["Evidence quality", "Source framing", "Uncertainty"],
  },
  {
    value: "financial_analyst",
    label: "Financial analyst",
    short: "Market impact and investor risk.",
    focus: ["Market impact", "Company exposure", "Investor risk"],
  },
  {
    value: "executive_brief",
    label: "Executive brief",
    short: "Decisions, urgency, and next moves.",
    focus: ["Decision relevance", "Strategic impact", "Urgency"],
  },
  {
    value: "policy_intelligence",
    label: "Policy intelligence",
    short: "Regulation and geopolitical stakes.",
    focus: ["Regulatory signal", "Government actors", "Implementation risk"],
  },
  {
    value: "academic_researcher",
    label: "Academic researcher",
    short: "Context, evidence quality, citations.",
    focus: ["Background context", "Evidence quality", "Research gaps"],
  },
  {
    value: "risk_analyst",
    label: "Risk analyst",
    short: "Downside scenarios and weak signals.",
    focus: ["Downside scenarios", "Early warnings", "Mitigations"],
  },
];

// final-product/README.md: six agents.
export const PIPELINE: PipelineAgent[] = [
  { n: "01", name: "Collector", blurb: "Trusted RSS first. Google News RSS fallback. Curated dataset when live coverage is weak." },
  { n: "02", name: "Filter & rank", blurb: "Credibility weight, freshness decay, and topic fit blended into a single source score. Duplicates removed." },
  { n: "03", name: "Summariser", blurb: "OpenAI-compatible model when an API key is present; deterministic local builder when it is not. Same brief schema either way." },
  { n: "04", name: "Comparison", blurb: "Outlet-by-outlet framing diff along the persona's comparison axes; conflicts are surfaced, not flattened." },
  { n: "05", name: "Insight", blurb: "Signals and points to watch, sized to the persona lens." },
  { n: "06", name: "Report", blurb: "HTML for circulation, Markdown for git, JSON for the Team B handoff. Citations and source weights survive every transit." },
];

// ranking.score_articles: three signals, exact weights.
export const SIGNALS: RankingSignal[] = [
  { key: "c", label: "Credibility", w: 0.45, blurb: "Per-outlet weight from the source registry; default 0.45 for unlisted outlets. A trusted-source preference boosts a matched outlet to 1.0." },
  { key: "f", label: "Freshness", w: 0.35, blurb: "Stepped age decay: ≤6h → 1.0, ≤24h → 0.85, ≤72h → 0.65, ≤7d → 0.45, older → 0.25. Missing dates default to 0.25." },
  { key: "t", label: "Topic fit", w: 0.20, blurb: "Keyword-token overlap between the topic and the article title + snippet, capped at 1.0. Live results must clear 0.45 to be selected." },
];

// auto/live/fallback → Balanced/Live/Saved.
export const COVERAGE_MODES: CoverageModeSpec[] = [
  { value: "auto", label: "Balanced", flow: "RSS → Google News → dataset", blurb: "Trusted RSS, then Google News, then the curated dataset, whichever returns enough signal first." },
  { value: "live", label: "Live", flow: "RSS + Google News only", blurb: "Force the live retrievers: trusted RSS plus Google News RSS." },
  { value: "fallback", label: "Saved", flow: "curated dataset, offline", blurb: "Force the curated dataset: for offline demos and reproducible briefs." },
];

// auth.py: roles, permissions, demo tokens. Default role = admin; RBAC on.
export const ROLES: RoleSpec[] = [
  {
    value: "viewer",
    label: "Viewer",
    token: "viewer-local-token",
    blurb: "Read saved briefs, exports, and the source registry.",
    perms: ["briefs:read", "exports:read", "sources:read"],
  },
  {
    value: "analyst",
    label: "Analyst",
    token: "analyst-local-token",
    blurb: "Generate briefs and read / write trusted sources. No delete, no JSON handoff.",
    perms: ["briefs:read", "briefs:create", "exports:read", "sources:read", "sources:write"],
  },
  {
    value: "admin",
    label: "Admin",
    token: "admin-local-token",
    blurb: "Everything Analyst can do, plus delete briefs and the Team B JSON handoff.",
    perms: ["briefs:read", "briefs:create", "briefs:delete", "exports:read", "handoff:read", "sources:read", "sources:write"],
  },
];

// The example brief: VERBATIM from artifacts/brief-a017839f67/brief.json.
// section_generation_mode = heuristic because the LLM step failed and fell back
// to the deterministic local builder (warnings below).
export const DEMO_BRIEF: DemoBrief = {
  brief_id: "brief-a017839f67",
  topic: "AI chip export controls",
  persona: "research_analyst",
  persona_label: "Research analyst",
  goal: "Assess investor exposure for semiconductor companies",
  mode_used: "live",
  section_generation_mode: "heuristic",
  warnings: ["llm_generation_failed", "heuristic_sections_used"],
  created_at: "2026-04-27T04:34:22.790659+00:00",
  confidence: {
    score: 65,
    level: "Medium",
    source_diversity: "Broad",
    freshness: "Limited",
    topic_fit: "Moderate",
    rationale: [
      "Five sources selected across three distinct outlets.",
      "Only two of five articles are within the freshness window.",
      "Topic-fit is moderate; live results cleared the 0.45 threshold.",
    ],
  },
  executive_summary:
    "For the topic 'AI chip export controls', using a research analyst lens, the strongest current signal comes from Bloomberg, with the selected coverage drawing on 5 sources including Bloomberg, Reuters, and crypto.news. The leading storyline is: AI Export Control Measures Aimed at China Gain Steam in US House. The stated research goal is to assess investor exposure for semiconductor companies.",
  key_takeaways: [
    "Bloomberg emphasizes that AI Export Control Measures Aimed at China Gain Steam in US House.",
    "Reuters emphasizes that US mulls new rules for AI chip exports, including requiring US investments by foreign firms.",
    "crypto.news emphasizes that congress Pushes to Control AI Chip Exports to China With Two Bipartisan Bills.",
    "Source ranking favors credibility, recency, and topic overlap instead of raw article volume.",
  ],
  key_facts: [
    "Bloomberg: AI Export Control Measures Aimed at China Gain Steam in US House.",
    "Reuters: US mulls new rules for AI chip exports, including requiring US investments by foreign firms.",
    "crypto.news: congress Pushes to Control AI Chip Exports to China With Two Bipartisan Bills.",
  ],
  framing_comparison:
    "Bloomberg sets the lead frame around ai export control measures aimed at china gain steam in us house.; Reuters adds emphasis on us mulls new rules for ai chip exports, including requiring us investments by foreign firms.; crypto.news adds emphasis on congress pushes to control ai chip exports to china with two bipartisan bills.",
  insights: [
    "The highest-confidence source signal is from Bloomberg, supported by 4 additional selected articles.",
    "The strongest value is the traceable comparison across 5 visible sources, not a single blended summary.",
    "Use this report as a focused starting point and inspect the cited sources before decisions.",
  ],
  uncertainties: [
    "The report is based on 5 selected articles, so coverage breadth is still limited.",
    "Some important context may still be missing while the story continues to develop across sources.",
    "The selected sources do not capture every regional or partisan framing of the topic.",
  ],
  source_evidence: [
    {
      n: "01",
      id: "live-6",
      src: "Bloomberg",
      url: "https://www.bloomberg.com/",
      cls: "Registry · Business",
      cred: 0.90,
      fresh: 0.45,
      fit: 0.50,
      total: 0.66,
      why: "High source trust, strong topic fit.",
      title: "AI Export Control Measures Aimed at China Gain Steam in US House",
      when: "2026-04-23T00:27:00+00:00",
    },
    {
      n: "02",
      id: "live-4",
      src: "Reuters",
      url: "https://www.reuters.com/",
      cls: "Registry · Wire",
      cred: 0.98,
      fresh: 0.25,
      fit: 0.50,
      total: 0.63,
      why: "High source trust, strong topic fit.",
      title: "US mulls new rules for AI chip exports, including requiring US investments by foreign firms",
      when: "2026-03-05T08:00:00+00:00",
    },
    {
      n: "03",
      id: "live-10",
      src: "crypto.news",
      url: "https://crypto.news/",
      cls: "Unlisted · default 0.45",
      cred: 0.45,
      fresh: 0.65,
      fit: 0.50,
      total: 0.53,
      why: "Strong topic fit.",
      title: "Congress Pushes to Control AI Chip Exports to China With Two Bipartisan Bills",
      when: "2026-04-24T21:20:00+00:00",
    },
    {
      n: "04",
      id: "live-8",
      src: "Gotrade",
      url: "https://heygotrade.com/",
      cls: "Unlisted · default 0.45",
      cred: 0.45,
      fresh: 0.45,
      fit: 0.75,
      total: 0.51,
      why: "Strong topic fit.",
      title: "AI Policy Heats Up as Export Controls and Google Collide",
      when: "2026-04-23T09:43:00+00:00",
    },
    {
      n: "05",
      id: "live-9",
      src: "BISI",
      url: "https://bisi.org/",
      cls: "Unlisted · default 0.45",
      cred: 0.45,
      fresh: 0.25,
      fit: 1.00,
      total: 0.49,
      why: "Strong topic fit.",
      title: "AI Chip Smuggling: The Limits of US Export Controls",
      when: "2026-04-06T05:02:00+00:00",
    },
  ],
};
