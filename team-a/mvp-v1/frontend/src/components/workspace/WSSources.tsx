import { useState, type ReactNode } from "react";
import type { TFunction } from "../../i18n";
import type {
  CustomTrustedSource,
  SourceCatalogItem,
  TrustedSourceSettings,
} from "../../types";

// ---- NewsProvider spec is duplicated from the old WSProviders to keep this
// file self-contained. The catalog comes from GET /api/news-providers.
export type NewsProviderSpec = {
  id: string;
  name: string;
  blurb: string;
  signup_url: string;
  body_access: "full" | "metadata" | "snippet";
};

type Props = {
  // Direct feeds (catalog + custom)
  catalog: SourceCatalogItem[];
  settings: TrustedSourceSettings;
  customDraft: CustomTrustedSource;
  canManage: boolean;
  isSaving: boolean;
  error: string;
  t: TFunction;
  onToggleCatalogSource: (sourceId: string) => void;
  onCustomDraftChange: (field: keyof CustomTrustedSource, value: string) => void;
  onAddCustomSource: () => void;
  onRemoveCustomSource: (sourceId: string) => void;

  // Web search (Google News toggle)
  onToggleGoogleNews: () => void;

  // External APIs
  providerCatalog: NewsProviderSpec[];
  providerKeys: Record<string, string>;
  providerDrafts: Record<string, string>;
  providerFlashSaved: Record<string, boolean>;
  onProviderDraftChange: (id: string, value: string) => void;
  onSaveProviderKey: (id: string) => void;
  onRemoveProviderKey: (id: string) => void;
};

const FEED_COLS = "24px 1.7fr 150px 1fr 100px";

// ---- Tiny reusable bits ----------------------------------------------------

function SectionHead({
  title,
  countLabel,
  copy,
}: {
  title: string;
  countLabel: string;
  copy?: string;
}) {
  return (
    <div style={{ marginBottom: 12, marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <h3 className="a-serif" style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
          {title}
        </h3>
        <span className="a-mono" style={{
          padding: "2px 9px", borderRadius: 999, fontSize: 10,
          letterSpacing: "0.04em", fontWeight: 600,
          background: "transparent", color: "var(--ab-ink-soft)",
          border: "1px solid var(--ab-rule)",
        }}>
          {countLabel.toUpperCase()}
        </span>
      </div>
      {copy && (
        <p style={{ fontSize: 12.5, color: "var(--ab-ink-soft)", margin: 0, maxWidth: 680 }}>
          {copy}
        </p>
      )}
    </div>
  );
}

function TagPill({
  on,
  text,
  accent = true,
}: {
  on: boolean;
  text: string;
  accent?: boolean;
}) {
  return (
    <span className="a-mono" style={{
      padding: "2px 9px", borderRadius: 999, fontSize: 10,
      letterSpacing: "0.04em", fontWeight: 600,
      background: on && accent ? "var(--ab-green-soft)" : "transparent",
      color: on && accent ? "var(--ab-green-deep)" : "var(--ab-ink-mute)",
      border: on && accent
        ? "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)"
        : "1px solid var(--ab-rule)",
    }}>
      {text.toUpperCase()}
    </span>
  );
}

// ---- Page ------------------------------------------------------------------

export function WSSources(p: Props) {
  const [localErr, setLocalErr] = useState("");
  const selectedIds = new Set(p.settings.selected_source_ids);

  const queryableCatalog = p.catalog.filter((src) => Boolean(src.feed_url));
  const directFeedsCount = queryableCatalog.length + p.settings.custom_sources.length;
  const providersConfigured = p.providerCatalog.filter((c) => Boolean(p.providerKeys[c.id])).length;

  function handleAddCustom() {
    if (!p.canManage) return;
    const name = p.customDraft.name.trim();
    const domain = p.customDraft.domain.trim();
    const feedUrl = p.customDraft.feed_url.trim();
    if (!name) { setLocalErr(p.t("sources.errName")); return; }
    if (!domain && !feedUrl) { setLocalErr(p.t("sources.errEndpoint")); return; }
    setLocalErr("");
    p.onAddCustomSource();
  }

  return (
    <div style={{ padding: "40px 56px 80px" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div className="a-smallcaps">{p.t("sources.title")}</div>
          <h2 className="a-serif" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 6 }}>
            {p.t("sources.heading")}
          </h2>
        </div>
        <span className="a-mono" style={{
          padding: "2px 9px", borderRadius: 999, fontSize: 10, letterSpacing: "0.04em", fontWeight: 600,
          background: "var(--ab-green-soft)", color: "var(--ab-green-deep)",
          border: "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)",
        }}>
          ● {(p.isSaving ? p.t("sources.autosaving") : p.t("sources.autosaved")).toUpperCase()}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "var(--ab-ink-soft)", marginBottom: 16, maxWidth: 720 }}>
        {p.t("sources.copy")}
      </p>
      {!p.canManage && <p style={{ marginBottom: 14, fontSize: 12.5, color: "var(--ab-accent)" }}>{p.t("sources.viewerNotice")}</p>}
      {p.error && <p style={{ marginBottom: 14, fontSize: 12.5, color: "var(--ab-accent)" }}>{p.error}</p>}

      {/* ====== Section 1 · Direct feeds =================================== */}
      <SectionHead
        title={p.t("sources.directFeeds.title")}
        countLabel={p.t("sources.directFeeds.count", { count: directFeedsCount })}
        copy={p.t("sources.directFeeds.copy")}
      />

      <div style={{ border: "1px solid var(--ab-rule)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: FEED_COLS, padding: "10px 16px", gap: 12,
          background: "var(--ab-paper-2)", borderBottom: "1px solid var(--ab-rule)",
          fontFamily: "var(--ab-font-mono)", fontSize: 10, letterSpacing: "0.08em",
          color: "var(--ab-ink-mute)", textTransform: "uppercase",
        }}>
          <span></span>
          <span>{p.t("sources.col.source")}</span>
          <span>{p.t("sources.col.cat")}</span>
          <span>{p.t("sources.col.weight")}</span>
          <span style={{ textAlign: "right" }}>{p.t("sources.col.state")}</span>
        </div>

        {queryableCatalog.map((src, i) => {
          const on = selectedIds.has(src.id);
          return (
            <div key={src.id} style={{
              display: "grid", gridTemplateColumns: FEED_COLS, padding: "12px 16px", alignItems: "center", gap: 12,
              borderBottom: (i < queryableCatalog.length - 1) || p.settings.custom_sources.length > 0
                ? "1px solid var(--ab-rule-soft)" : 0,
            }}>
              <button
                type="button"
                onClick={() => p.onToggleCatalogSource(src.id)}
                disabled={!p.canManage}
                aria-pressed={on}
                style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: `1.5px solid ${on ? "var(--ab-green)" : "var(--ab-ink)"}`,
                  background: on ? "var(--ab-green)" : "transparent",
                  cursor: p.canManage ? "pointer" : "not-allowed",
                  color: "#fff", fontSize: 11, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  opacity: p.canManage ? 1 : 0.5,
                }}
              >{on && "✓"}</button>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{src.name}</div>
                <code className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)" }}>{src.domain || src.feed_url}</code>
              </div>
              <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-soft)", letterSpacing: "0.04em" }}>
                {(src.category || "").toUpperCase()} · {(src.region || "").toUpperCase()}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 4, background: "var(--ab-rule-soft)", borderRadius: 2, position: "relative" }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    width: `${(src.weight ?? 0) * 100}%`,
                    background: on ? "var(--ab-green)" : "var(--ab-ink)",
                    opacity: on ? 1 : 0.45, borderRadius: 2,
                  }} />
                </div>
                <span className="a-mono" style={{ fontSize: 11, color: "var(--ab-ink-soft)" }}>
                  {(src.weight ?? 0).toFixed(2)}
                </span>
              </div>
              <span style={{ justifySelf: "flex-end" }}>
                <TagPill on={on} text={on ? p.t("sources.trusted") : p.t("sources.available")} />
              </span>
            </div>
          );
        })}

        {p.settings.custom_sources.map((src, i) => (
          <div key={src.id || src.name} style={{
            display: "grid", gridTemplateColumns: FEED_COLS, padding: "12px 16px", alignItems: "center", gap: 12,
            borderTop: i === 0 ? "1px solid var(--ab-rule)" : "1px solid var(--ab-rule-soft)",
            background: "color-mix(in oklab, var(--ab-green) 5%, transparent)",
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 4, background: "var(--ab-green)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 11, fontWeight: 700,
            }}>✓</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{src.name}</div>
              <code className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)" }}>{src.domain || src.feed_url}</code>
            </div>
            <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-soft)" }}>CUSTOM</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: "var(--ab-rule-soft)", borderRadius: 2, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, width: "96%", background: "var(--ab-green)", borderRadius: 2 }} />
              </div>
              <span className="a-mono" style={{ fontSize: 11, color: "var(--ab-ink-soft)" }}>0.96</span>
            </div>
            <span style={{ justifySelf: "flex-end" }}>
              <button
                type="button"
                disabled={!p.canManage}
                onClick={() => p.onRemoveCustomSource(src.id || src.name)}
                className="a-mono"
                style={{
                  fontSize: 10, letterSpacing: "0.04em", border: "1px solid var(--ab-rule)",
                  background: "transparent", padding: "2px 7px",
                  cursor: p.canManage ? "pointer" : "not-allowed", color: "var(--ab-ink-soft)",
                }}
              >
                {p.t("sources.removeCustom")}
              </button>
            </span>
          </div>
        ))}
      </div>

      {/* Custom-source form */}
      <div style={{
        border: "1px solid var(--ab-rule)", borderRadius: 10,
        padding: "16px 18px", marginTop: 14, opacity: p.canManage ? 1 : 0.6,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.08em" }}>
            {p.t("sources.addCustom").toUpperCase()}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--ab-ink-mute)" }}>{p.t("sources.customHint")}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr auto", gap: 8 }}>
          <input
            type="text" value={p.customDraft.name} disabled={!p.canManage}
            onChange={(e) => p.onCustomDraftChange("name", e.target.value)}
            placeholder={p.t("sources.name")}
            className="a-input"
            style={{ padding: "9px 12px", borderRadius: 8, background: "var(--ab-paper-2)", border: "1px solid var(--ab-rule)", fontSize: 12.5 }}
          />
          <input
            type="text" value={p.customDraft.domain} disabled={!p.canManage}
            onChange={(e) => p.onCustomDraftChange("domain", e.target.value)}
            placeholder="trade.example"
            className="a-input"
            style={{ padding: "9px 12px", borderRadius: 8, background: "var(--ab-paper-2)", border: "1px solid var(--ab-rule)", fontSize: 12.5 }}
          />
          <input
            type="text" value={p.customDraft.feed_url} disabled={!p.canManage}
            onChange={(e) => p.onCustomDraftChange("feed_url", e.target.value)}
            placeholder="https://trade.example/feed.xml"
            className="a-input a-mono"
            style={{ padding: "9px 12px", borderRadius: 8, background: "var(--ab-paper-2)", border: "1px solid var(--ab-rule)", fontSize: 12 }}
          />
          <button
            type="button" onClick={handleAddCustom} disabled={!p.canManage}
            style={{
              padding: "0 16px", fontSize: 13, borderRadius: 8,
              border: "1px solid var(--ab-ink)",
              background: "var(--ab-ink)", color: "var(--ab-paper)",
              cursor: p.canManage ? "pointer" : "not-allowed",
            }}
          >
            + {p.t("sources.add")}
          </button>
        </div>
        {localErr && <p style={{ marginTop: 10, fontSize: 12.5, color: "var(--ab-accent)" }}>{localErr}</p>}
      </div>

      {/* ====== Section 2 · Web search (Google News) ====================== */}
      <SectionHead
        title={p.t("sources.webSearch.title")}
        countLabel={p.t("sources.webSearch.count")}
        copy={p.t("sources.webSearch.copy")}
      />

      <div style={{
        border: "1px solid var(--ab-rule)", borderRadius: 10,
        padding: "16px 18px", display: "grid",
        gridTemplateColumns: "1fr auto", gap: 18, alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {p.t("sources.webSearch.googleNews")}
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ab-ink-soft)", margin: "4px 0 0", maxWidth: 600 }}>
            {p.t("sources.webSearch.googleNewsBlurb")}
          </p>
        </div>
        <ToggleSwitch
          on={p.settings.google_news_enabled}
          disabled={!p.canManage}
          onToggle={p.onToggleGoogleNews}
          onLabel={p.t("sources.webSearch.on")}
          offLabel={p.t("sources.webSearch.off")}
        />
      </div>

      {/* ====== Section 3 · External APIs ================================= */}
      <SectionHead
        title={p.t("sources.externalAPIs.title")}
        countLabel={p.t("sources.externalAPIs.count", { count: providersConfigured })}
        copy={p.t("sources.externalAPIs.copy")}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 14 }}>
        {p.providerCatalog.map((spec) => (
          <ProviderCard key={spec.id} spec={spec} p={p} />
        ))}
      </div>
    </div>
  );
}

// ---- ToggleSwitch (Google News on/off) -------------------------------------

function ToggleSwitch({
  on, disabled, onToggle, onLabel, offLabel,
}: {
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={on}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "6px 6px 6px 14px", borderRadius: 999,
        border: `1px solid ${on ? "var(--ab-green)" : "var(--ab-rule)"}`,
        background: on ? "color-mix(in oklab, var(--ab-green) 12%, transparent)" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span className="a-mono" style={{
        fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600,
        color: on ? "var(--ab-green-deep)" : "var(--ab-ink-mute)",
      }}>
        {on ? onLabel : offLabel}
      </span>
      <span style={{
        width: 28, height: 16, borderRadius: 999,
        background: on ? "var(--ab-green)" : "var(--ab-rule)",
        position: "relative", transition: "background .15s",
      }}>
        <span style={{
          position: "absolute", top: 2, left: on ? 14 : 2,
          width: 12, height: 12, borderRadius: "50%",
          background: "var(--ab-paper)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          transition: "left .15s",
        }} />
      </span>
    </button>
  );
}

// ---- ProviderCard (External API) -------------------------------------------

function bodyAccessLabel(t: TFunction, kind: NewsProviderSpec["body_access"]): string {
  if (kind === "full") return t("providers.bodyFull");
  if (kind === "metadata") return t("providers.bodyMetadata");
  return t("providers.bodySnippet");
}

function ProviderCard({ spec, p }: { spec: NewsProviderSpec; p: Props }): ReactNode {
  const draft = p.providerDrafts[spec.id] || "";
  const hasKey = Boolean(p.providerKeys[spec.id]);
  const flash = Boolean(p.providerFlashSaved[spec.id]);
  return (
    <div style={{
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
        onChange={(e) => p.onProviderDraftChange(spec.id, e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && p.canManage) p.onSaveProviderKey(spec.id); }}
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
          onClick={() => p.onSaveProviderKey(spec.id)}
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
            onClick={() => p.onRemoveProviderKey(spec.id)}
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
}
