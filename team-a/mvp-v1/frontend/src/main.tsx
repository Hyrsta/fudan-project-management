import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Bookmark,
  Braces,
  Clock3,
  Database,
  Download,
  ExternalLink,
  FileCode,
  FileText,
  KeyRound,
  Link as LinkIcon,
  LogIn,
  LogOut,
  RadioTower,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
} from "lucide-react";
import "./styles.css";

type RoleConfig = {
  value: string;
  label: string;
  description: string;
};

type PersonaOption = {
  value: string;
  label: string;
  icon: string;
  short: string;
  focus: string[];
};

type RbacConfig = {
  enabled: boolean;
  header_name: string;
  cookie_name: string;
  default_role: string;
  demo_tokens: Record<string, string>;
  roles: RoleConfig[];
};

type AppConfig = {
  rbac: RbacConfig;
  persona_options: PersonaOption[];
};

type AuthSession = {
  role: string;
  token: string;
  custom: boolean;
};

type ArticleRecord = {
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

type ReportConfidence = {
  score: number;
  level: string;
  source_diversity: string;
  freshness: string;
  topic_fit: string;
  rationale: string[];
};

type BriefResponse = {
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

const ROLE_STORAGE_KEY = "news-intel-role";
const AUTH_TOKEN_STORAGE_KEY = "news-intel-auth-token";
const AUTH_MODE_STORAGE_KEY = "news-intel-auth-mode";
const LEGACY_CUSTOM_KEY_STORAGE_KEY = "news-intel-api-key";

const fallbackConfig: AppConfig = {
  rbac: {
    enabled: true,
    header_name: "X-API-Key",
    cookie_name: "news_brief_api_key",
    default_role: "admin",
    demo_tokens: {
      viewer: "viewer-local-token",
      analyst: "analyst-local-token",
      admin: "admin-local-token",
    },
    roles: [
      { value: "viewer", label: "Viewer", description: "Read saved briefs and exports." },
      { value: "analyst", label: "Analyst", description: "Generate briefs and read exports." },
      { value: "admin", label: "Admin", description: "Manage full handoff access." },
    ],
  },
  persona_options: [],
};

function App() {
  const [config, setConfig] = useState<AppConfig>(fallbackConfig);
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadStoredAuthSession());
  const [recentBriefs, setRecentBriefs] = useState<BriefResponse[]>([]);
  const [brief, setBrief] = useState<BriefResponse | null>(null);
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState("auto");
  const [persona, setPersona] = useState("research_analyst");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [toast, setToast] = useState("");

  const activeRole = authSession?.role || config.rbac.default_role;
  const activeToken = config.rbac.enabled ? authSession?.token || "" : "";

  const roleMeta = useMemo(
    () => config.rbac.roles.find((item) => item.value === activeRole) || config.rbac.roles[0],
    [activeRole, config.rbac.roles],
  );

  useEffect(() => {
    async function bootstrap() {
      try {
        const response = await fetch("/api/config");
        if (response.ok) {
          const payload = (await response.json()) as AppConfig;
          setConfig(payload);
          setPersona((current) =>
            payload.persona_options.some((item) => item.value === current)
              ? current
              : payload.persona_options[0]?.value || current,
          );
        }
      } catch {
        setError("Could not load workspace configuration.");
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (!config.rbac.enabled || activeToken) {
      loadRecentBriefs(activeToken);
    } else {
      setRecentBriefs([]);
    }
  }, [activeToken, config.rbac.enabled]);

  useEffect(() => {
    if (!config.rbac.enabled) return;

    if (authSession?.token) {
      localStorage.setItem(ROLE_STORAGE_KEY, authSession.role);
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authSession.token);
      localStorage.setItem(AUTH_MODE_STORAGE_KEY, authSession.custom ? "custom" : "demo");
      localStorage.removeItem(LEGACY_CUSTOM_KEY_STORAGE_KEY);
      document.cookie = `${config.rbac.cookie_name}=${encodeURIComponent(authSession.token)}; Path=/; SameSite=Lax`;
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_MODE_STORAGE_KEY);
      localStorage.removeItem(LEGACY_CUSTOM_KEY_STORAGE_KEY);
      document.cookie = `${config.rbac.cookie_name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  }, [authSession, config.rbac.cookie_name, config.rbac.enabled]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleLogin(nextSession: AuthSession) {
    setLoginError("");
    const response = await fetch("/api/briefs/recent", {
      headers: authHeaders(nextSession.token),
    });
    if (!response.ok) {
      const payload = await safeJson(response);
      throw new Error(payload?.detail || "Access key was rejected.");
    }
    setRecentBriefs((await response.json()) as BriefResponse[]);
    setAuthSession(nextSession);
    setBrief(null);
    setToast("Signed in");
  }

  function handleLogout() {
    setAuthSession(null);
    setBrief(null);
    setRecentBriefs([]);
    setError("");
    setLoginError("");
    setToast("Signed out");
  }

  async function loadRecentBriefs(token = activeToken) {
    if (config.rbac.enabled && !token) return;
    try {
      const response = await fetch("/api/briefs/recent", {
        headers: authHeaders(token),
      });
      if (response.status === 401) {
        setAuthSession(null);
        return;
      }
      if (!response.ok) return;
      setRecentBriefs((await response.json()) as BriefResponse[]);
    } catch {
      setRecentBriefs([]);
    }
  }

  function authHeaders(token = activeToken): HeadersInit {
    if (!config.rbac.enabled || !token) return {};
    return { [config.rbac.header_name || "X-API-Key"]: token };
  }

  async function submitBrief(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/briefs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ topic, mode, persona, goal }),
      });
      if (!response.ok) {
        const payload = await safeJson(response);
        throw new Error(payload?.detail || `Request failed with ${response.status}`);
      }
      const payload = (await response.json()) as BriefResponse;
      setBrief(payload);
      setToast("Brief generated");
      loadRecentBriefs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the brief.");
    } finally {
      setIsLoading(false);
    }
  }

  async function openBrief(briefId: string) {
    setError("");
    try {
      const response = await fetch(`/api/briefs/${encodeURIComponent(briefId)}`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        const payload = await safeJson(response);
        throw new Error(payload?.detail || `Request failed with ${response.status}`);
      }
      setBrief((await response.json()) as BriefResponse);
      setToast("Brief loaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the brief.");
    }
  }

  function applyQuickTopic(value: string) {
    setTopic(value);
    window.setTimeout(() => document.getElementById("topic-input")?.focus(), 0);
  }

  if (config.rbac.enabled && !authSession) {
    return (
      <>
        <LoginPage config={config.rbac} error={loginError} onError={setLoginError} onLogin={handleLogin} />
        {toast && <div className="toast-message">{toast}</div>}
      </>
    );
  }

  return (
    <div className="app-frame">
      <aside className="side-rail" aria-label="Primary navigation">
        <a className="rail-logo" href="/" aria-label="News Intelligence Studio">
          <FileText size={18} />
        </a>
        <nav className="rail-nav" aria-label="Workspace">
          <button className="rail-button is-active" type="button" aria-label="Search">
            <Search size={18} />
          </button>
          <button
            className="rail-button"
            type="button"
            aria-label="Saved reports"
            onClick={() => setToast("Recent reports are shown beside the form")}
          >
            <Bookmark size={18} />
          </button>
          <button
            className="rail-button"
            type="button"
            aria-label="Sources"
            onClick={() => setToast("Source evidence appears in generated reports")}
          >
            <Database size={18} />
          </button>
        </nav>
      </aside>

      <main className="app-content">
        <div className="app-shell">
          <header className="topbar">
            <div className="brand">
              <h1>News Intelligence Studio</h1>
              <span className="status-chip sync">Local data synced</span>
            </div>
            <div className="top-actions">
              <span className="status-chip">
                <ShieldCheck size={16} />
                {roleMeta?.label || activeRole}
              </span>
              {config.rbac.enabled && (
                <button className="secondary-button compact" type="button" onClick={handleLogout}>
                  <LogOut size={16} />
                  Sign out
                </button>
              )}
              <span className="avatar-chip">{(roleMeta?.label || activeRole).slice(0, 2).toUpperCase()}</span>
            </div>
          </header>

          <section className="workspace-grid">
            <section className="command-panel" aria-label="Report controls">
              <div className="command-head">
                <div>
                  <span className="command-title">
                    <Search size={16} />
                    Research command
                  </span>
                  <p className="section-copy">Generate a source-aware brief from live or saved coverage.</p>
                </div>
              </div>

              <form className="brief-form" onSubmit={submitBrief}>
                <div className="topic-row">
                  <label className="sr-only" htmlFor="topic-input">
                    Topic
                  </label>
                  <div className="input-shell">
                    <Search size={18} aria-hidden="true" />
                    <input
                      id="topic-input"
                      type="text"
                      name="topic"
                      placeholder="Research a topic or story"
                      autoComplete="off"
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="primary-button" disabled={isLoading}>
                    <Sparkles size={18} aria-hidden="true" />
                    {isLoading ? "Generating" : "Generate"}
                  </button>
                </div>

                <div className="goal-row">
                  <div className="input-shell">
                    <Target size={18} aria-hidden="true" />
                    <input
                      type="text"
                      name="goal"
                      placeholder="Optional: decision or question this report should answer"
                      autoComplete="off"
                      value={goal}
                      onChange={(event) => setGoal(event.target.value)}
                    />
                  </div>
                </div>

                <PersonaPicker options={config.persona_options} value={persona} onChange={setPersona} />

                <div className="control-row">
                  <label className="select-shell">
                    <span>
                      <RadioTower size={16} />
                      Coverage
                    </span>
                    <select value={mode} onChange={(event) => setMode(event.target.value)}>
                      <option value="auto">Balanced coverage</option>
                      <option value="live">Live sources</option>
                      <option value="fallback">Saved source set</option>
                    </select>
                  </label>
                  <div className="quick-topics" aria-label="Example topics">
                    {["AI chip export controls", "US inflation outlook", "Open-source AI model competition"].map((item) => (
                      <button className="topic-chip" type="button" key={item} onClick={() => applyQuickTopic(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              {error && (
                <div className="error-banner" role="alert">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}
            </section>

            <aside className="recent-panel" aria-label="Recent reports">
              <div className="section-head compact">
                <h2>Recent</h2>
                <span className="badge neutral">{recentBriefs.length}</span>
              </div>
              <div className="recent-stack">
                {recentBriefs.length ? (
                  recentBriefs.slice(0, 8).map((item) => (
                    <button className="recent-card" type="button" key={item.brief_id} onClick={() => openBrief(item.brief_id)}>
                      <strong>{item.topic}</strong>
                      <span>{item.persona_label}</span>
                    </button>
                  ))
                ) : (
                  <p className="helper">Generated briefs will appear here.</p>
                )}
              </div>
            </aside>
          </section>

          <section id="result-panel" className="result-panel">
            {brief ? <BriefReport brief={brief} /> : <EmptyState />}
          </section>
        </div>
      </main>
      {toast && <div className="toast-message">{toast}</div>}
    </div>
  );
}

function LoginPage({
  config,
  error,
  onError,
  onLogin,
}: {
  config: RbacConfig;
  error: string;
  onError: (value: string) => void;
  onLogin: (session: AuthSession) => Promise<void>;
}) {
  const hasDemoTokens = Object.keys(config.demo_tokens).length > 0;
  const [mode, setMode] = useState<"demo" | "custom">(hasDemoTokens ? "demo" : "custom");
  const [selectedRole, setSelectedRole] = useState(config.default_role || config.roles[0]?.value || "viewer");
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hasDemoTokens) setMode("custom");
    if (!config.roles.some((role) => role.value === selectedRole)) {
      setSelectedRole(config.default_role || config.roles[0]?.value || "viewer");
    }
  }, [config.default_role, config.roles, hasDemoTokens, selectedRole]);

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    onError("");
    const token = mode === "demo" ? config.demo_tokens[selectedRole] : apiKey.trim();
    if (!token) {
      onError(mode === "demo" ? "Demo access is not configured." : "Enter an API key.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin({ role: selectedRole, token, custom: mode === "custom" });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-shell" aria-label="Sign in">
        <div className="login-brand">
          <a className="rail-logo login-logo" href="/" aria-label="News Intelligence Studio">
            <FileText size={20} />
          </a>
          <span className="status-chip sync">Local service online</span>
          <h1>News Intelligence Studio</h1>
        </div>

        <form className="login-panel" onSubmit={submitLogin}>
          <div className="login-head">
            <span className="command-title">
              <ShieldCheck size={16} />
              Access required
            </span>
            <h2>Sign in</h2>
          </div>

          <div className="login-tabs" role="tablist" aria-label="Access method">
            <button
              className={`login-tab ${mode === "demo" ? "is-selected" : ""}`}
              type="button"
              disabled={!hasDemoTokens}
              onClick={() => setMode("demo")}
            >
              <UserRoundCheck size={16} />
              Demo account
            </button>
            <button
              className={`login-tab ${mode === "custom" ? "is-selected" : ""}`}
              type="button"
              onClick={() => setMode("custom")}
            >
              <KeyRound size={16} />
              API key
            </button>
          </div>

          {mode === "demo" ? (
            <div className="login-role-grid">
              {config.roles.map((role) => (
                <button
                  className={`login-role-card ${selectedRole === role.value ? "is-selected" : ""}`}
                  type="button"
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                >
                  <span>{role.label.slice(0, 2).toUpperCase()}</span>
                  <strong>{role.label}</strong>
                  <small>{role.description}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="login-custom-grid">
              <label className="login-field">
                <span>
                  <KeyRound size={16} />
                  API key
                </span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </label>
              <label className="select-shell">
                <span>
                  <ShieldCheck size={16} />
                  Role label
                </span>
                <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
                  {config.roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {error && (
            <div className="error-banner" role="alert">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            <LogIn size={18} />
            {isSubmitting ? "Signing in" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function PersonaPicker({
  options,
  value,
  onChange,
}: {
  options: PersonaOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="persona-panel" aria-label="Report lens">
      <div className="persona-title">
        <span>
          <UserRoundCheck size={16} />
          Persona lens
        </span>
        <p className="helper">Choose how the report should think.</p>
      </div>
      <div className="persona-grid">
        {options.map((option) => (
          <button
            className={`persona-card ${value === option.value ? "is-selected" : ""}`}
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            <span className="persona-icon">{option.label.slice(0, 2).toUpperCase()}</span>
            <span className="persona-copy">
              <strong>{option.label}</strong>
              <small>{option.short}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BriefReport({ brief }: { brief: BriefResponse }) {
  const titles = brief.section_titles || {};
  const riskItems = brief.risk_notes.length ? brief.risk_notes : brief.uncertainties;
  return (
    <article className="report-card">
      <header className="report-head">
        <div className="report-title-block">
          <div className="report-kicker">
            <span className="badge success">Ready</span>
            {brief.warnings.includes("fallback_used") && <span className="badge warning">Saved coverage</span>}
          </div>
          <h2 className="report-topic">{brief.topic}</h2>
          <div className="report-meta">
            <span className="meta-pill">
              <UserRoundCheck size={15} />
              {brief.persona_label}
            </span>
            <span className="meta-pill">
              <LinkIcon size={15} />
              {brief.articles.length} sources
            </span>
            <span className="meta-pill">
              <RadioTower size={15} />
              {brief.mode_used === "live" ? "Live coverage" : "Saved coverage"}
            </span>
            <span className="meta-pill">
              <Clock3 size={15} />
              {new Date(brief.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        <nav className="report-actions" aria-label="Report actions">
          <a className="text-link-button" href={`/briefs/${brief.brief_id}/export`}>
            <FileCode size={16} />
            HTML
          </a>
          <a className="text-link-button" href={`/briefs/${brief.brief_id}/export.md`}>
            <Download size={16} />
            Markdown
          </a>
          <a className="text-link-button" href={`/briefs/${brief.brief_id}/handoff`}>
            <Braces size={16} />
            Handoff
          </a>
        </nav>
      </header>

      <section className="summary-row">
        <div className="summary-block">
          <h3 className="section-title">{titles.summary || "Executive summary"}</h3>
          <p>{brief.executive_summary || brief.overview}</p>
          {brief.goal && (
            <p className="goal-note">
              <Target size={16} />
              {brief.goal}
            </p>
          )}
        </div>
        <aside className="evidence-panel">
          <div className="evidence-topline">
            <h3>Evidence</h3>
            <Database size={18} />
          </div>
          <div className="evidence-number">{brief.confidence.score}</div>
          <p className="helper">{brief.confidence.level} confidence</p>
          <div className="confidence-grid">
            <span>
              <strong>{brief.confidence.source_diversity}</strong>
              <small>Sources</small>
            </span>
            <span>
              <strong>{brief.confidence.freshness}</strong>
              <small>Freshness</small>
            </span>
            <span>
              <strong>{brief.confidence.topic_fit}</strong>
              <small>Topic fit</small>
            </span>
          </div>
        </aside>
      </section>

      <section className="insight-grid">
        <ReportList title={titles.takeaways || "Takeaways"} items={brief.key_takeaways} />
        <ReportList title={titles.facts || "Key facts"} items={brief.key_facts} />
        <ReportList title={titles.insights || "Signals"} items={brief.insights} />
        <ReportList title={titles.watch || "Watch"} items={riskItems} />
      </section>

      <section className="report-section">
        <h3>{titles.note || "Coverage note"}</h3>
        <p>{brief.framing_comparison}</p>
      </section>

      <section className="source-list" aria-label="Selected sources list">
        <div className="section-head compact">
          <h3>Source evidence</h3>
          <span className="source-count">{brief.articles.length} selected</span>
        </div>
        {brief.articles.map((article) => (
          <article className="source-row" key={article.id}>
            <div className="source-main">
              <h4>{article.title}</h4>
              <p className="source-meta">{article.source}</p>
              <p className="source-snippet">{article.summary || article.snippet}</p>
              <div className="score-row">
                <span className="score-pill">Rank {article.total_score.toFixed(2)}</span>
                <span className="score-pill">Fresh {article.freshness_score.toFixed(2)}</span>
                <span className="score-pill">Fit {article.match_score.toFixed(2)}</span>
              </div>
            </div>
            <a className="text-link-button" href={article.url} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              Source
            </a>
          </article>
        ))}
      </section>
    </article>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="report-section">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState() {
  return (
    <article className="empty-state">
      <span className="empty-icon">
        <FileText size={26} />
      </span>
      <h2>Ready for a briefing</h2>
      <p>Enter a topic, choose a persona lens, and generate a source-aware report.</p>
    </article>
  );
}

function loadStoredAuthSession(): AuthSession | null {
  const token =
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
    localStorage.getItem(LEGACY_CUSTOM_KEY_STORAGE_KEY) ||
    readCookie(fallbackConfig.rbac.cookie_name);
  if (!token) return null;

  return {
    token,
    role: localStorage.getItem(ROLE_STORAGE_KEY) || fallbackConfig.rbac.default_role,
    custom: localStorage.getItem(AUTH_MODE_STORAGE_KEY) === "custom",
  };
}

function readCookie(name: string): string {
  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : "";
}

async function safeJson(response: Response): Promise<{ detail?: string } | null> {
  try {
    return (await response.json()) as { detail?: string };
  } catch {
    return null;
  }
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
