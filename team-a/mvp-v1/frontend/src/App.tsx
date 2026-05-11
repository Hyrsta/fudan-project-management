import { FormEvent, useEffect, useMemo, useState } from "react";
import { fallbackConfig } from "./config";
import { AppShell } from "./components/AppShell";
import { BriefComposer } from "./components/BriefComposer";
import { BriefHistory } from "./components/BriefHistory";
import { BriefReport } from "./components/BriefReport";
import { EmptyState } from "./components/EmptyState";
import { LoginPage } from "./components/LoginPage";
import { TrustedSourcesPage } from "./components/TrustedSourcesPage";
import type {
  AppConfig,
  AuthSession,
  BriefResponse,
  CustomTrustedSource,
  TrustedSourcePayload,
  TrustedSourceSettings,
} from "./types";
import {
  createTranslator,
  htmlLang,
  loadStoredLanguage,
  localizeRole,
  persistLanguage,
  type Language,
} from "./i18n";
import { loadStoredAuthSession, persistAuthSession } from "./utils/auth";
import { safeJson } from "./utils/http";

type AppView = "briefing" | "history" | "sources";

const emptyTrustedSourceSettings: TrustedSourceSettings = {
  selected_source_ids: [],
  custom_sources: [],
};

const emptyCustomSourceDraft: CustomTrustedSource = {
  name: "",
  domain: "",
  feed_url: "",
};

export default function App() {
  const [config, setConfig] = useState<AppConfig>(fallbackConfig);
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadStoredAuthSession());
  const [recentBriefs, setRecentBriefs] = useState<BriefResponse[]>([]);
  const [trustedSourcePayload, setTrustedSourcePayload] = useState<TrustedSourcePayload | null>(null);
  const [trustedSourceDraft, setTrustedSourceDraft] = useState<TrustedSourceSettings>(emptyTrustedSourceSettings);
  const [customSourceDraft, setCustomSourceDraft] = useState<CustomTrustedSource>(emptyCustomSourceDraft);
  const [brief, setBrief] = useState<BriefResponse | null>(null);
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState("auto");
  const [persona, setPersona] = useState("research_analyst");
  const [language, setLanguage] = useState<Language>(() => loadStoredLanguage());
  const [activeView, setActiveView] = useState<AppView>("briefing");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingTrustedSources, setIsSavingTrustedSources] = useState(false);
  const [error, setError] = useState("");
  const [trustedSourcesError, setTrustedSourcesError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [toast, setToast] = useState("");
  const t = useMemo(() => createTranslator(language), [language]);

  const activeRole = authSession?.role || config.rbac.default_role;
  const activeToken = config.rbac.enabled ? authSession?.token || "" : "";
  const roleMeta = useMemo(
    () => config.rbac.roles.find((item) => item.value === activeRole) || config.rbac.roles[0],
    [activeRole, config.rbac.roles],
  );
  const roleLabel = localizeRole(activeRole, language, roleMeta?.label || activeRole);
  const canDeleteBriefs = !config.rbac.enabled || activeRole === "admin";
  const canManageTrustedSources = !config.rbac.enabled || activeRole === "admin" || activeRole === "analyst";

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
        setError(t("error.configLoad"));
      }
    }
    bootstrap();
  }, [t]);

  useEffect(() => {
    if (!config.rbac.enabled || activeToken) {
      loadRecentBriefs(activeToken);
      loadTrustedSources(activeToken);
    } else {
      setRecentBriefs([]);
      setTrustedSourcePayload(null);
      setTrustedSourceDraft(emptyTrustedSourceSettings);
    }
  }, [activeToken, config.rbac.enabled]);

  useEffect(() => {
    persistAuthSession(authSession, config.rbac);
  }, [authSession, config.rbac]);

  useEffect(() => {
    persistLanguage(language);
    document.documentElement.lang = htmlLang(language);
  }, [language]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleLogin(nextSession: AuthSession) {
    setLoginError("");
    const response = await fetch("/api/briefs/history?limit=50", {
      headers: authHeaders(nextSession.token),
    });
    if (!response.ok) {
      const payload = await safeJson(response);
      throw new Error(payload?.detail || t("error.accessRejected"));
    }
    setRecentBriefs((await response.json()) as BriefResponse[]);
    setAuthSession(nextSession);
    setBrief(null);
    setActiveView("briefing");
    setToast(t("toast.signedIn"));
  }

  function handleLogout() {
    setAuthSession(null);
    setBrief(null);
    setRecentBriefs([]);
    setTrustedSourcePayload(null);
    setTrustedSourceDraft(emptyTrustedSourceSettings);
    setCustomSourceDraft(emptyCustomSourceDraft);
    setActiveView("briefing");
    setError("");
    setTrustedSourcesError("");
    setLoginError("");
    setToast(t("toast.signedOut"));
  }

  async function loadRecentBriefs(token = activeToken) {
    if (config.rbac.enabled && !token) return;
    try {
      const response = await fetch("/api/briefs/history?limit=50", {
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

  async function loadTrustedSources(token = activeToken) {
    if (config.rbac.enabled && !token) return;
    try {
      const response = await fetch("/api/trusted-sources", {
        headers: authHeaders(token),
      });
      if (response.status === 401) {
        setAuthSession(null);
        return;
      }
      if (!response.ok) {
        const payload = await safeJson(response);
        throw new Error(payload?.detail || t("error.requestFailed", { status: response.status }));
      }
      const payload = (await response.json()) as TrustedSourcePayload;
      setTrustedSourcePayload(payload);
      setTrustedSourceDraft(payload.settings);
      setTrustedSourcesError("");
    } catch (err) {
      setTrustedSourcesError(err instanceof Error ? err.message : t("error.trustedSourcesLoad"));
    }
  }

  function onToggleCatalogSource(sourceId: string) {
    setTrustedSourceDraft((current) => {
      const selected = new Set(current.selected_source_ids);
      if (selected.has(sourceId)) {
        selected.delete(sourceId);
      } else {
        selected.add(sourceId);
      }
      return {
        ...current,
        selected_source_ids: Array.from(selected),
      };
    });
  }

  function updateCustomSourceDraft(field: keyof CustomTrustedSource, value: string) {
    setCustomSourceDraft((current) => ({ ...current, [field]: value }));
  }

  function onAddCustomSource() {
    const name = customSourceDraft.name.trim();
    const domain = customSourceDraft.domain.trim();
    const feedUrl = customSourceDraft.feed_url.trim();
    if (!name) {
      setTrustedSourcesError(t("error.sourceNameRequired"));
      return;
    }
    if (!domain && !feedUrl) {
      setTrustedSourcesError(t("error.sourceEndpointRequired"));
      return;
    }

    const source: CustomTrustedSource = {
      id: `custom-${slugify(name || domain || feedUrl) || "source"}`,
      name,
      domain,
      feed_url: feedUrl,
      weight: 0.96,
    };
    setTrustedSourceDraft((current) => ({
      ...current,
      custom_sources: [
        ...current.custom_sources.filter((item) => (item.id || item.name) !== source.id),
        source,
      ],
    }));
    setCustomSourceDraft(emptyCustomSourceDraft);
    setTrustedSourcesError("");
  }

  function removeCustomSource(sourceId: string) {
    setTrustedSourceDraft((current) => ({
      ...current,
      custom_sources: current.custom_sources.filter((item) => (item.id || item.name) !== sourceId),
    }));
  }

  async function saveTrustedSources() {
    setTrustedSourcesError("");
    setIsSavingTrustedSources(true);
    try {
      const response = await fetch("/api/trusted-sources", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(trustedSourceDraft),
      });
      if (!response.ok) {
        const payload = await safeJson(response);
        throw new Error(payload?.detail || t("error.requestFailed", { status: response.status }));
      }
      const settings = (await response.json()) as TrustedSourceSettings;
      setTrustedSourceDraft(settings);
      setTrustedSourcePayload((current) => ({
        catalog: current?.catalog || [],
        settings,
      }));
      setToast(t("toast.trustedSourcesSaved"));
    } catch (err) {
      setTrustedSourcesError(err instanceof Error ? err.message : t("error.trustedSourcesSave"));
    } finally {
      setIsSavingTrustedSources(false);
    }
  }

  async function deleteBrief(briefId: string) {
    if (!window.confirm(t("error.deleteConfirm"))) return;
    setError("");
    try {
      const response = await fetch(`/api/briefs/${encodeURIComponent(briefId)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!response.ok) {
        const payload = await safeJson(response);
        throw new Error(payload?.detail || t("error.requestFailed", { status: response.status }));
      }
      setRecentBriefs((items) => items.filter((item) => item.brief_id !== briefId));
      setBrief((current) => (current?.brief_id === briefId ? null : current));
      setToast(t("toast.briefDeleted"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.deleteFailed"));
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
        throw new Error(payload?.detail || t("error.requestFailed", { status: response.status }));
      }
      const payload = (await response.json()) as BriefResponse;
      setBrief(payload);
      setActiveView("briefing");
      setToast(t("toast.briefGenerated"));
      loadRecentBriefs();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.generateFailed"));
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
        throw new Error(payload?.detail || t("error.requestFailed", { status: response.status }));
      }
      setBrief((await response.json()) as BriefResponse);
      setActiveView("briefing");
      setToast(t("toast.briefLoaded"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.openFailed"));
    }
  }

  if (config.rbac.enabled && !authSession) {
    return (
      <>
        <LoginPage
          config={config.rbac}
          error={loginError}
          language={language}
          t={t}
          onError={setLoginError}
          onLanguageChange={setLanguage}
          onLogin={handleLogin}
        />
        {toast && <div className="toast-message">{toast}</div>}
      </>
    );
  }

  return (
    <>
      <AppShell
        activeView={activeView}
        roleLabel={roleLabel}
        rbacEnabled={config.rbac.enabled}
        language={language}
        t={t}
        onHint={setToast}
        onViewChange={setActiveView}
        onLanguageChange={setLanguage}
        onLogout={handleLogout}
      >
        {activeView === "briefing" && (
          <>
            <section className="briefing-view">
              <BriefComposer
                topic={topic}
                goal={goal}
                mode={mode}
                persona={persona}
                personaOptions={config.persona_options}
                language={language}
                t={t}
                isLoading={isLoading}
                error={error}
                onTopicChange={setTopic}
                onGoalChange={setGoal}
                onModeChange={setMode}
                onPersonaChange={setPersona}
                onSubmit={submitBrief}
              />
            </section>

            <section id="result-panel" className="result-panel">
              {brief ? <BriefReport brief={brief} language={language} t={t} /> : <EmptyState t={t} />}
            </section>
          </>
        )}

        {activeView === "history" && (
          <BriefHistory
            briefs={recentBriefs}
            canDelete={canDeleteBriefs}
            language={language}
            t={t}
            onOpenBrief={openBrief}
            onDeleteBrief={deleteBrief}
          />
        )}

        {activeView === "sources" && (
          <TrustedSourcesPage
            catalog={trustedSourcePayload?.catalog || []}
            settings={trustedSourceDraft}
            customDraft={customSourceDraft}
            canManage={canManageTrustedSources}
            isSaving={isSavingTrustedSources}
            error={trustedSourcesError}
            language={language}
            t={t}
            onToggleCatalogSource={onToggleCatalogSource}
            onCustomDraftChange={updateCustomSourceDraft}
            onAddCustomSource={onAddCustomSource}
            onRemoveCustomSource={removeCustomSource}
            onSave={saveTrustedSources}
          />
        )}
      </AppShell>
      {toast && <div className="toast-message">{toast}</div>}
    </>
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
