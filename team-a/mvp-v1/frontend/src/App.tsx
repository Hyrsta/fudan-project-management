import { FormEvent, useEffect, useMemo, useState } from "react";
import { fallbackConfig } from "./config";
import { AppShell } from "./components/AppShell";
import { BriefComposer } from "./components/BriefComposer";
import { BriefReport } from "./components/BriefReport";
import { EmptyState } from "./components/EmptyState";
import { LoginPage } from "./components/LoginPage";
import { RecentBriefs } from "./components/RecentBriefs";
import type { AppConfig, AuthSession, BriefResponse } from "./types";
import { loadStoredAuthSession, persistAuthSession } from "./utils/auth";
import { safeJson } from "./utils/http";

export default function App() {
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
  const roleLabel = roleMeta?.label || activeRole;

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
    persistAuthSession(authSession, config.rbac);
  }, [authSession, config.rbac]);

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

  if (config.rbac.enabled && !authSession) {
    return (
      <>
        <LoginPage config={config.rbac} error={loginError} onError={setLoginError} onLogin={handleLogin} />
        {toast && <div className="toast-message">{toast}</div>}
      </>
    );
  }

  return (
    <>
      <AppShell
        roleLabel={roleLabel}
        rbacEnabled={config.rbac.enabled}
        onHint={setToast}
        onLogout={handleLogout}
      >
        <section className="analyst-grid">
          <BriefComposer
            topic={topic}
            goal={goal}
            mode={mode}
            persona={persona}
            personaOptions={config.persona_options}
            isLoading={isLoading}
            error={error}
            onTopicChange={setTopic}
            onGoalChange={setGoal}
            onModeChange={setMode}
            onPersonaChange={setPersona}
            onSubmit={submitBrief}
          />
          <RecentBriefs briefs={recentBriefs} onOpenBrief={openBrief} />
        </section>

        <section id="result-panel" className="result-panel">
          {brief ? <BriefReport brief={brief} /> : <EmptyState />}
        </section>
      </AppShell>
      {toast && <div className="toast-message">{toast}</div>}
    </>
  );
}
