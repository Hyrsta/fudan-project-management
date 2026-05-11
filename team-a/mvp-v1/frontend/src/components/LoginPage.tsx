import { FormEvent, useEffect, useState } from "react";
import { Activity, FileText, KeyRound, LogIn, ShieldCheck, UserRoundCheck } from "lucide-react";
import type { AuthSession, RbacConfig } from "../types";

type LoginPageProps = {
  config: RbacConfig;
  error: string;
  onError: (value: string) => void;
  onLogin: (session: AuthSession) => Promise<void>;
};

export function LoginPage({ config, error, onError, onLogin }: LoginPageProps) {
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
    <main className="login-screen command-center">
      <section className="login-shell" aria-label="Sign in">
        <div className="login-intel">
          <a className="rail-logo login-logo" href="/" aria-label="News Intelligence Studio">
            <FileText size={20} />
          </a>
          <span className="eyebrow">
            <Activity size={14} />
            Local service online
          </span>
          <h1>News Intelligence Studio</h1>
          <p>Source-ranked reports, persona lenses, and local handoff exports in one controlled workspace.</p>
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
              Access console
            </span>
            <h2>Choose operating role</h2>
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
              {error}
            </div>
          )}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            <LogIn size={18} />
            {isSubmitting ? "Signing in" : "Enter workspace"}
          </button>
        </form>
      </section>
    </main>
  );
}
