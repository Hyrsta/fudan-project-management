import { FormEvent, useEffect, useState } from "react";
import { Activity, FileText, KeyRound, LogIn, ShieldCheck } from "lucide-react";
import type { Language, TFunction } from "../i18n";
import type { AuthSession, RbacConfig } from "../types";
import { LanguageToggle } from "./LanguageToggle";

type LoginPageProps = {
  config: RbacConfig;
  error: string;
  language: Language;
  t: TFunction;
  onError: (value: string) => void;
  onLanguageChange: (language: Language) => void;
  onLogin: (session: AuthSession) => Promise<void>;
};

export function LoginPage({ config, error, language, t, onError, onLanguageChange, onLogin }: LoginPageProps) {
  const hasDemoTokens = Object.keys(config.demo_tokens).length > 0;
  const [mode, setMode] = useState<"demo" | "custom">(hasDemoTokens ? "demo" : "custom");
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const demoRole = resolveDemoRole(config);

  useEffect(() => {
    if (!hasDemoTokens) setMode("custom");
  }, [hasDemoTokens]);

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    onError("");
    const token = mode === "demo" ? config.demo_tokens[demoRole] : apiKey.trim();
    if (!token) {
      onError(mode === "demo" ? t("error.demoNotConfigured") : t("error.enterApiKey"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin({ role: mode === "demo" ? demoRole : config.default_role, token, custom: mode === "custom" });
    } catch (err) {
      onError(err instanceof Error ? err.message : t("error.signInFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-screen command-center">
      <section className="login-shell" aria-label={t("auth.signInLabel")}>
        <div className="login-intel">
          <a className="rail-logo login-logo" href="/" aria-label={t("product.name")}>
            <FileText size={20} />
          </a>
          <span className="eyebrow">
            <Activity size={14} />
            {t("product.online")}
          </span>
          <h1>{t("product.name")}</h1>
          <p>{t("product.description")}</p>
          <div className="signal-board" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <form className="login-panel" onSubmit={submitLogin}>
          <div className="login-head">
            <span className="command-title">
              <ShieldCheck size={16} />
              {t("auth.secureLocalAccess")}
            </span>
            <h2>{t("auth.enterWorkspace")}</h2>
          </div>
          <LanguageToggle language={language} t={t} onLanguageChange={onLanguageChange} />

          {mode === "demo" ? (
            <div className="login-entry-panel">
              <p>{t("auth.demoDescription")}</p>
              <button className="primary-button" type="submit" disabled={isSubmitting || !hasDemoTokens}>
                <LogIn size={18} />
                {isSubmitting ? t("auth.signingIn") : t("auth.enterDemoWorkspace")}
              </button>
              <button className="text-link-button login-switch" type="button" onClick={() => setMode("custom")}>
                <KeyRound size={16} />
                {t("auth.useApiKey")}
              </button>
            </div>
          ) : (
            <div className="login-custom-grid">
              <label className="login-field">
                <span>
                  <KeyRound size={16} />
                  {t("auth.apiKey")}
                </span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </label>
              <button className="secondary-button login-switch" type="button" disabled={!hasDemoTokens} onClick={() => setMode("demo")}>
                {t("auth.useDemoWorkspace")}
              </button>
            </div>
          )}

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {mode === "custom" && (
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              <LogIn size={18} />
              {isSubmitting ? t("auth.signingIn") : t("auth.enterWorkspace")}
            </button>
          )}
        </form>
      </section>
    </main>
  );
}

function resolveDemoRole(config: RbacConfig): string {
  const preferredRoles = [config.default_role, "admin", "analyst", "viewer"];
  const role = preferredRoles.find((item) => Boolean(config.demo_tokens[item]));
  return role || Object.keys(config.demo_tokens)[0] || config.default_role;
}
