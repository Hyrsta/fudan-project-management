import type { TFunction } from "../../i18n";

export type NewsProviderSpec = {
  id: string;
  name: string;
  blurb: string;
  signup_url: string;
  body_access: "full" | "metadata" | "snippet";
};

type Props = {
  catalog: NewsProviderSpec[];
  keys: Record<string, string>;          // saved keys per provider id
  drafts: Record<string, string>;        // per-provider input drafts
  flashSaved: Record<string, boolean>;   // per-provider "Saved!" flash
  canManage: boolean;
  t: TFunction;
  onDraftChange: (id: string, value: string) => void;
  onSaveKey: (id: string) => void;
  onRemoveKey: (id: string) => void;
};

function bodyAccessLabel(t: TFunction, kind: NewsProviderSpec["body_access"]) {
  if (kind === "full") return t("providers.bodyFull");
  if (kind === "metadata") return t("providers.bodyMetadata");
  return t("providers.bodySnippet");
}

export function WSProviders(p: Props) {
  const configured = p.catalog.filter((c) => Boolean(p.keys[c.id])).length;

  return (
    <div style={{ padding: "40px 56px 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div className="a-smallcaps">{p.t("providers.title")}</div>
          <h2 className="a-serif" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 6 }}>
            {p.t("providers.heading")}
          </h2>
        </div>
        <span className="a-mono" style={{
          padding: "2px 9px", borderRadius: 999, fontSize: 10,
          letterSpacing: "0.04em", fontWeight: 600,
          background: configured > 0 ? "var(--ab-green-soft)" : "transparent",
          color: configured > 0 ? "var(--ab-green-deep)" : "var(--ab-ink-soft)",
          border: configured > 0
            ? "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)"
            : "1px solid var(--ab-rule)",
        }}>
          {p.t("providers.configuredCount", { count: configured }).toUpperCase()}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "var(--ab-ink-soft)", marginBottom: 18, maxWidth: 680 }}>
        {p.t("providers.copy")}
      </p>
      {!p.canManage && <p style={{ marginBottom: 14, fontSize: 12.5, color: "var(--ab-accent)" }}>{p.t("sources.viewerNotice")}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 14 }}>
        {p.catalog.map((spec) => {
          const draft = p.drafts[spec.id] || "";
          const hasKey = Boolean(p.keys[spec.id]);
          const flash = Boolean(p.flashSaved[spec.id]);
          return (
            <div key={spec.id} style={{
              border: "1px solid var(--ab-rule)", borderRadius: 10,
              padding: "18px 18px 16px", background: "var(--ab-paper)",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <h3 className="a-serif" style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
                  {spec.name}
                </h3>
                <span className="a-mono" style={{
                  fontSize: 9.5, letterSpacing: "0.06em", color: "var(--ab-ink-mute)",
                  textTransform: "uppercase",
                }}>{bodyAccessLabel(p.t, spec.body_access)}</span>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ab-ink-soft)", margin: 0 }}>
                {spec.blurb}
              </p>
              <input
                type="password"
                value={draft}
                disabled={!p.canManage}
                onChange={(e) => p.onDraftChange(spec.id, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && p.canManage) p.onSaveKey(spec.id); }}
                placeholder={hasKey ? "••••••••••••" : p.t("providers.placeholder")}
                autoComplete="off"
                spellCheck={false}
                className="a-input a-mono"
                style={{
                  padding: "9px 11px", fontSize: 12.5, borderRadius: 7,
                  border: "1px solid color-mix(in oklab, var(--ab-ink) 28%, transparent)",
                  background: "var(--ab-paper-2)",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => p.onSaveKey(spec.id)}
                  disabled={!p.canManage || !draft.trim()}
                  style={{
                    padding: "7px 13px", fontSize: 12.5, borderRadius: 7,
                    border: "1px solid var(--ab-ink)",
                    background: "var(--ab-ink)", color: "var(--ab-paper)",
                    opacity: p.canManage && draft.trim() ? 1 : 0.45,
                    cursor: p.canManage && draft.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  {flash ? p.t("model.saved") : p.t("model.save")}
                </button>
                {hasKey && (
                  <button
                    type="button"
                    onClick={() => p.onRemoveKey(spec.id)}
                    disabled={!p.canManage}
                    className="a-mono"
                    style={{
                      padding: "7px 11px", fontSize: 10.5, letterSpacing: "0.04em",
                      border: "1px solid var(--ab-rule)", background: "transparent",
                      cursor: p.canManage ? "pointer" : "not-allowed",
                      color: "var(--ab-accent)", borderRadius: 7,
                    }}
                  >
                    {p.t("model.remove")}
                  </button>
                )}
                <span style={{ flex: 1 }} />
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontFamily: "var(--ab-font-mono)", fontSize: 9.5, letterSpacing: "0.04em",
                  color: hasKey ? "var(--ab-green-deep)" : "var(--ab-ink-mute)",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: hasKey ? "var(--ab-green)" : "var(--ab-ink-mute)" }} />
                  {hasKey ? p.t("providers.statusActive") : p.t("providers.statusInactive")}
                </span>
              </div>
              <a
                href={spec.signup_url}
                target="_blank"
                rel="noreferrer"
                className="a-mono"
                style={{
                  fontSize: 10.5, letterSpacing: "0.04em", color: "var(--ab-ink-soft)",
                  textTransform: "uppercase", textDecoration: "underline",
                  textDecorationColor: "color-mix(in oklab, var(--ab-ink) 24%, transparent)",
                  alignSelf: "flex-start",
                }}
              >
                {p.t("providers.getKey")} →
              </a>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "center" }}>
        <span style={{ flex: 1 }} />
        <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.04em" }}>
          GET /api/news-providers · POST /api/briefs with X-Provider-&lt;id&gt;-Key
        </span>
      </div>
    </div>
  );
}
