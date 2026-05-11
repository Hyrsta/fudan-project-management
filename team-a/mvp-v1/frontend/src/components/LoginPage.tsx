import { FormEvent, useEffect, useState } from "react";
import { Activity, FileText, KeyRound, LogIn, ShieldCheck } from "lucide-react";
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
      onError(mode === "demo" ? "Demo access is not configured." : "Enter an API key.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin({ role: mode === "demo" ? demoRole : config.default_role, token, custom: mode === "custom" });
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
              Secure local access
            </span>
            <h2>Enter workspace</h2>
          </div>

          {mode === "demo" ? (
            <div className="login-entry-panel">
              <p>
                Open the local demo with report generation, saved briefs, exports, and handoff access enabled.
              </p>
              <button className="primary-button" type="submit" disabled={isSubmitting || !hasDemoTokens}>
                <LogIn size={18} />
                {isSubmitting ? "Signing in" : "Enter demo workspace"}
              </button>
              <button className="text-link-button login-switch" type="button" onClick={() => setMode("custom")}>
                <KeyRound size={16} />
                Use API key
              </button>
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
              <button className="secondary-button login-switch" type="button" disabled={!hasDemoTokens} onClick={() => setMode("demo")}>
                Use demo workspace
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
              {isSubmitting ? "Signing in" : "Enter workspace"}
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
