import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { fallbackConfig } from "./config";
import { LoginPage } from "./components/LoginPage";
import { MarketingHome } from "./components/marketing/MarketingHome";
import { MarketingProduct } from "./components/marketing/MarketingProduct";
import { MarketingAccess } from "./components/marketing/MarketingAccess";
import { MarketingAbout } from "./components/marketing/MarketingAbout";
import { WorkspaceShell } from "./components/workspace/WorkspaceShell";
import { WSComposer } from "./components/workspace/WSComposer";
import { WSEmpty } from "./components/workspace/WSEmpty";
import { WSHistory } from "./components/workspace/WSHistory";
import { WSReport } from "./components/workspace/WSReport";
import { WSSources } from "./components/workspace/WSSources";
import { WSProviders, type NewsProviderSpec } from "./components/workspace/WSProviders";
import { PRODUCT } from "./marketingData";
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

type AppView = "briefing" | "history" | "sources" | "providers";
type AppRoute = "home" | "product" | "access" | "about" | "login" | "workspace";

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
  const [route, setRoute] = useState<AppRoute>(() => getCurrentRoute());
  const [activeView, setActiveView] = useState<AppView>("briefing");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingTrustedSources, setIsSavingTrustedSources] = useState(false);
  const [error, setError] = useState("");
  const [trustedSourcesError, setTrustedSourcesError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [toast, setToast] = useState("");
  const trustedSourceSaveSequence = useRef(0);
  const t = useMemo(() => createTranslator(language), [language]);

  const [modelKey, setModelKey] = useState<string>(
    () => {
      try { return localStorage.getItem("studio-model-key") || ""; }
      catch { return ""; }
    },
  );
  const [keyDraft, setKeyDraft] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const hasKey = Boolean(modelKey);

  function saveKey() {
    const v = keyDraft.trim();
    if (!v) return;
    setModelKey(v);
    try { localStorage.setItem("studio-model-key", v); } catch {}
    setKeyDraft("");
    setKeySaved(true);
    window.setTimeout(() => setKeySaved(false), 1400);
  }

  function removeKey() {
    setModelKey("");
    try { localStorage.removeItem("studio-model-key"); } catch {}
  }

  // ----- News-API provider keys (BYO, per-browser localStorage) -----
  const PROVIDER_KEY_STORAGE_PREFIX = "studio-provider-key-";
  const [providerCatalog, setProviderCatalog] = useState<NewsProviderSpec[]>([]);
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [providerDrafts, setProviderDrafts] = useState<Record<string, string>>({});
  const [providerSavedFlash, setProviderSavedFlash] = useState<Record<string, boolean>>({});

  function loadProviderKeysFromStorage(catalog: NewsProviderSpec[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const spec of catalog) {
      try {
        const v = localStorage.getItem(PROVIDER_KEY_STORAGE_PREFIX + spec.id) || "";
        if (v) out[spec.id] = v;
      } catch {}
    }
    return out;
  }
  function saveProviderKey(id: string) {
    const v = (providerDrafts[id] || "").trim();
    if (!v) return;
    setProviderKeys((prev) => ({ ...prev, [id]: v }));
    try { localStorage.setItem(PROVIDER_KEY_STORAGE_PREFIX + id, v); } catch {}
    setProviderDrafts((prev) => ({ ...prev, [id]: "" }));
    setProviderSavedFlash((prev) => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      setProviderSavedFlash((prev) => ({ ...prev, [id]: false }));
    }, 1400);
  }
  function removeProviderKey(id: string) {
    setProviderKeys((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try { localStorage.removeItem(PROVIDER_KEY_STORAGE_PREFIX + id); } catch {}
  }
  function setProviderDraft(id: string, value: string) {
    setProviderDrafts((prev) => ({ ...prev, [id]: value }));
  }
  function providerHeaderEntries(): Record<string, string> {
    const h: Record<string, string> = {};
    for (const [id, key] of Object.entries(providerKeys)) {
      if (!key) continue;
      const cap = id.charAt(0).toUpperCase() + id.slice(1);
      h[`X-Provider-${cap}-Key`] = key;
    }
    return h;
  }

  const activeRole = authSession?.role || config.rbac.default_role;
  const activeToken = config.rbac.enabled ? authSession?.token || "" : "";
  const roleMeta = useMemo(
    () => config.rbac.roles.find((item) => item.value === activeRole) || config.rbac.roles[0],
    [activeRole, config.rbac.roles],
  );
  const roleLabel = localizeRole(activeRole, language, roleMeta?.label || activeRole);
  const accountName = authSession?.email
    ? authSession.email.split("@")[0]
    : roleLabel;
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
      loadNewsProviders(activeToken);
    } else {
      setRecentBriefs([]);
      setTrustedSourcePayload(null);
      setTrustedSourceDraft(emptyTrustedSourceSettings);
      setProviderCatalog([]);
      setProviderKeys({});
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
    function syncRoute() {
      setRoute(getCurrentRoute());
    }

    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function navigateTo(path: string) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setRoute(getCurrentRoute());
    window.scrollTo({ top: 0, left: 0 });
  }

  useEffect(() => {
    if (route === "login" && authSession) {
      navigateTo("/workspace");
    }
  }, [authSession, route]);

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
    navigateTo("/workspace");
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
    navigateTo("/login");
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
    const selected = new Set(trustedSourceDraft.selected_source_ids);
    if (selected.has(sourceId)) {
      selected.delete(sourceId);
    } else {
      selected.add(sourceId);
    }
    const nextSettings = {
      ...trustedSourceDraft,
      selected_source_ids: Array.from(selected),
    };
    commitTrustedSources(nextSettings);
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
    const nextSettings = {
      ...trustedSourceDraft,
      custom_sources: [
        ...trustedSourceDraft.custom_sources.filter((item) => (item.id || item.name) !== source.id),
        source,
      ],
    };
    commitTrustedSources(nextSettings);
    setCustomSourceDraft(emptyCustomSourceDraft);
    setTrustedSourcesError("");
  }

  function removeCustomSource(sourceId: string) {
    const nextSettings = {
      ...trustedSourceDraft,
      custom_sources: trustedSourceDraft.custom_sources.filter((item) => (item.id || item.name) !== sourceId),
    };
    commitTrustedSources(nextSettings);
  }

  function commitTrustedSources(nextSettings: TrustedSourceSettings) {
    if (!canManageTrustedSources) return;
    const previousSettings = trustedSourceDraft;
    setTrustedSourceDraft(nextSettings);
    void persistTrustedSources(nextSettings, previousSettings);
  }

  async function persistTrustedSources(nextSettings: TrustedSourceSettings, previousSettings: TrustedSourceSettings) {
    const saveSequence = trustedSourceSaveSequence.current + 1;
    trustedSourceSaveSequence.current = saveSequence;
    setTrustedSourcesError("");
    setIsSavingTrustedSources(true);
    try {
      const response = await fetch("/api/trusted-sources", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(nextSettings),
      });
      if (!response.ok) {
        const payload = await safeJson(response);
        throw new Error(payload?.detail || t("error.requestFailed", { status: response.status }));
      }
      const settings = (await response.json()) as TrustedSourceSettings;
      if (saveSequence !== trustedSourceSaveSequence.current) return;
      setTrustedSourceDraft(settings);
      setTrustedSourcePayload((current) => ({
        catalog: current?.catalog || [],
        settings,
      }));
    } catch (err) {
      if (saveSequence !== trustedSourceSaveSequence.current) return;
      setTrustedSourceDraft(previousSettings);
      setTrustedSourcesError(err instanceof Error ? err.message : t("error.trustedSourcesSave"));
    } finally {
      if (saveSequence === trustedSourceSaveSequence.current) {
        setIsSavingTrustedSources(false);
      }
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

  function briefHeaders(token = activeToken): HeadersInit {
    const h: Record<string, string> = { ...(authHeaders(token) as Record<string, string>) };
    if (modelKey) h["X-Summariser-Key"] = modelKey;
    Object.assign(h, providerHeaderEntries());
    return h;
  }

  async function loadNewsProviders(token = activeToken) {
    if (config.rbac.enabled && !token) return;
    try {
      const response = await fetch("/api/news-providers", {
        headers: authHeaders(token),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { catalog: NewsProviderSpec[] };
      setProviderCatalog(payload.catalog);
      setProviderKeys(loadProviderKeysFromStorage(payload.catalog));
    } catch {
      // non-fatal — providers panel will be empty
    }
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
          ...briefHeaders(),
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
        headers: briefHeaders(),
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

  if (route === "home") {
    return <MarketingHome language={language} t={t} onLanguageChange={setLanguage} />;
  }
  if (route === "product") {
    return <MarketingProduct language={language} t={t} onLanguageChange={setLanguage} />;
  }
  if (route === "access") {
    return <MarketingAccess language={language} t={t} onLanguageChange={setLanguage} />;
  }
  if (route === "about") {
    return <MarketingAbout language={language} t={t} onLanguageChange={setLanguage} />;
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
      <WorkspaceShell
        activeView={activeView}
        language={language}
        t={t}
        roleLabel={roleLabel}
        accountName={accountName}
        productName={PRODUCT.name}
        hasKey={hasKey}
        keyDraft={keyDraft}
        keySaved={keySaved}
        rbacEnabled={config.rbac.enabled}
        onViewChange={setActiveView}
        onLanguageChange={setLanguage}
        onKeyDraftChange={setKeyDraft}
        onSaveKey={saveKey}
        onRemoveKey={removeKey}
        onSignOut={handleLogout}
      >
        {activeView === "briefing" && (
          <div style={{ padding: "40px 56px 80px" }}>
            <WSComposer
              topic={topic}
              goal={goal}
              mode={mode}
              persona={persona}
              language={language}
              t={t}
              isLoading={isLoading}
              canGenerate={!config.rbac.enabled || activeRole !== "viewer"}
              error={error}
              onTopicChange={setTopic}
              onGoalChange={setGoal}
              onModeChange={setMode}
              onPersonaChange={setPersona}
              onSubmit={submitBrief}
            />
            {brief ? (
              <WSReport
                brief={brief}
                language={language}
                t={t}
                hasKey={hasKey}
                canHandoff={!config.rbac.enabled || activeRole === "admin"}
              />
            ) : (
              <WSEmpty t={t} />
            )}
          </div>
        )}

        {activeView === "history" && (
          <WSHistory
            briefs={recentBriefs}
            canDelete={canDeleteBriefs}
            language={language}
            t={t}
            onOpenBrief={openBrief}
            onDeleteBrief={deleteBrief}
          />
        )}

        {activeView === "sources" && (
          <WSSources
            catalog={trustedSourcePayload?.catalog || []}
            settings={trustedSourceDraft}
            customDraft={customSourceDraft}
            canManage={canManageTrustedSources}
            isSaving={isSavingTrustedSources}
            error={trustedSourcesError}
            t={t}
            onToggleCatalogSource={onToggleCatalogSource}
            onCustomDraftChange={updateCustomSourceDraft}
            onAddCustomSource={onAddCustomSource}
            onRemoveCustomSource={removeCustomSource}
          />
        )}

        {activeView === "providers" && (
          <WSProviders
            catalog={providerCatalog}
            keys={providerKeys}
            drafts={providerDrafts}
            flashSaved={providerSavedFlash}
            canManage={canManageTrustedSources}
            t={t}
            onDraftChange={setProviderDraft}
            onSaveKey={saveProviderKey}
            onRemoveKey={removeProviderKey}
          />
        )}
      </WorkspaceShell>
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

function getCurrentRoute(): AppRoute {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/product") return "product";
  if (pathname === "/access") return "access";
  if (pathname === "/about") return "about";
  if (pathname === "/login") return "login";
  if (pathname === "/workspace") return "workspace";
  return "home";
}
