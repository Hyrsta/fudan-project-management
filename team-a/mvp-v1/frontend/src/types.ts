export type RoleConfig = {
  value: string;
  label: string;
  description: string;
};

export type PersonaOption = {
  value: string;
  label: string;
  icon: string;
  short: string;
  focus: string[];
};

export type RbacConfig = {
  enabled: boolean;
  header_name: string;
  cookie_name: string;
  default_role: string;
  demo_tokens: Record<string, string>;
  roles: RoleConfig[];
};

export type AppConfig = {
  rbac: RbacConfig;
  persona_options: PersonaOption[];
};

export type AuthSession = {
  role: string;
  token: string;
  custom: boolean;
};

export type ArticleRecord = {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at?: string | null;
  snippet: string;
  summary?: string | null;
  source_weight: number;
  freshness_score: number;
  match_score: number;
  total_score: number;
};

export type ReportConfidence = {
  score: number;
  level: string;
  source_diversity: string;
  freshness: string;
  topic_fit: string;
  rationale: string[];
};

export type BriefResponse = {
  brief_id: string;
  topic: string;
  created_at: string;
  mode_used: "live" | "fallback";
  section_generation_mode: string;
  persona: string;
  persona_label: string;
  goal: string;
  articles: ArticleRecord[];
  overview: string;
  executive_summary: string;
  key_takeaways: string[];
  key_facts: string[];
  framing_comparison: string;
  insights: string[];
  uncertainties: string[];
  risk_notes: string[];
  export_html_path: string;
  markdown_export_path: string;
  quality_notes: string[];
  warnings: string[];
  lens_focus: string[];
  section_titles: Record<string, string>;
  confidence: ReportConfidence;
};
