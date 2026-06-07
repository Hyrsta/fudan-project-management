import { useState } from "react";
import type { TFunction } from "../../i18n";
import type {
  CustomTrustedSource,
  SourceCatalogItem,
  TrustedSourceSettings,
} from "../../types";

export type NewsProviderSpec = {
  id: string;
  name: string;
  blurb: string;
  signup_url: string;
  body_access: "full" | "metadata" | "snippet";
};

type Props = {
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
  onToggleGoogleNews: () => void;
  providerCatalog: NewsProviderSpec[];
  providerKeys: Record<string, string>;
  providerDrafts: Record<string, string>;
  providerFlashSaved: Record<string, boolean>;
  onProviderDraftChange: (id: string, value: string) => void;
  onSaveProviderKey: (id: string) => void;
  onRemoveProviderKey: (id: string) => void;
};

// One unified container; each row picks its own internal layout.
// rowFrame keeps borders + padding consistent across the heterogeneous rows.
const rowFrameStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderTop: "1px solid var(--ab-rule-soft)",
};

// ---- Page ------------------------------------------------------------------

export function WSSources(p: Props) {
  const [localErr, setLocalErr] = useState("");
  const selectedIds = new Set(p.settings.selected_source_ids);

  const queryableCatalog = p.catalog.filter((src) => Boolean(src.feed_url));

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

  const totalOn =
    p.settings.selected_source_ids.length
    + p.settings.custom_sources.length
    + (p.settings.google_news_enabled ? 1 : 0)
    + p.providerCatalog.filter((c) => Boolean(p.providerKeys[c.id])).length;
  const totalAvailable =
    queryableCatalog.length + p.settings.custom_sources.length
    + 1 /* Google News */ + p.providerCatalog.length;

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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="a-mono" style={{
            padding: "2px 9px", borderRadius: 999, fontSize: 10, letterSpacing: "0.04em", fontWeight: 600,
            background: "transparent", color: "var(--ab-ink-soft)",
            border: "1px solid var(--ab-rule)",
          }}>
            {p.t("sources.onOfTotal", { on: totalOn, total: totalAvailable }).toUpperCase()}
          </span>
          <span className="a-mono" style={{
            padding: "2px 9px", borderRadius: 999, fontSize: 10, letterSpacing: "0.04em", fontWeight: 600,
            background: "var(--ab-green-soft)", color: "var(--ab-green-deep)",
            border: "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)",
          }}>
            ● {(p.isSaving ? p.t("sources.autosaving") : p.t("sources.autosaved")).toUpperCase()}
          </span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "var(--ab-ink-soft)", marginBottom: 18, maxWidth: 720 }}>
        {p.t("sources.copy")}
      </p>
      {!p.canManage && <p style={{ marginBottom: 14, fontSize: 12.5, color: "var(--ab-accent)" }}>{p.t("sources.viewerNotice")}</p>}
      {p.error && <p style={{ marginBottom: 14, fontSize: 12.5, color: "var(--ab-accent)" }}>{p.error}</p>}

      {/* ====== Outlets table ============================================= */}
      <div style={{ border: "1px solid var(--ab-rule)", borderRadius: 10, overflow: "hidden", background: "var(--ab-paper)" }}>
        <SectionBand
          label={p.t("sources.outlets.title")}
          count={queryableCatalog.length + p.settings.custom_sources.length}
          subtitle={p.t("sources.outlets.subtitle")}
          asHeader
        />

        {queryableCatalog.map((src, i) => {
          const on = selectedIds.has(src.id);
          return (
            <OutletRow
              key={src.id}
              first={false}
              t={p.t}
              on={on}
              canManage={p.canManage}
              name={src.name}
              tagline={src.domain || src.feed_url || ""}
              meta={`${(src.category || "").toUpperCase()} · ${(src.region || "").toUpperCase()}`}
              weight={src.weight ?? 0}
              onToggle={() => p.onToggleCatalogSource(src.id)}
            />
          );
        })}

        {p.settings.custom_sources.map((src) => (
          <OutletRow
            key={src.id || src.name}
            first={false}
            t={p.t}
            on={true}
            canManage={p.canManage}
            name={src.name}
            tagline={src.domain || src.feed_url}
            meta={"CUSTOM"}
            weight={0.96}
            customTint
            onToggle={() => {}}
            onRemove={() => p.onRemoveCustomSource(src.id || src.name)}
          />
        ))}
      </div>

      {/* ====== Add custom outlet form (only adds outlets, not aggregators) */}
      <div style={{
        border: "1px solid var(--ab-rule)", borderRadius: 10,
        padding: "16px 18px", marginTop: 14, opacity: p.canManage ? 1 : 0.6,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.08em" }}>
            {p.t("sources.addCustomOutlet").toUpperCase()}
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

      {/* ====== Aggregators table (visual gap above) ====================== */}
      <div style={{
        marginTop: 32,
        border: "1px solid var(--ab-rule)", borderRadius: 10, overflow: "hidden", background: "var(--ab-paper)",
      }}>
        <SectionBand
          label={p.t("sources.aggregators.title")}
          count={1 /* google news */ + p.providerCatalog.length}
          subtitle={p.t("sources.aggregators.subtitle")}
          asHeader
        />

        <GoogleNewsRow
          t={p.t}
          on={p.settings.google_news_enabled}
          disabled={!p.canManage}
          onToggle={p.onToggleGoogleNews}
        />

        {p.providerCatalog.map((spec) => {
          const draft = p.providerDrafts[spec.id] || "";
          const hasKey = Boolean(p.providerKeys[spec.id]);
          const flash = Boolean(p.providerFlashSaved[spec.id]);
          return (
            <ProviderRow
              key={spec.id}
              t={p.t}
              spec={spec}
              hasKey={hasKey}
              draft={draft}
              flash={flash}
              canManage={p.canManage}
              onDraftChange={(v) => p.onProviderDraftChange(spec.id, v)}
              onSave={() => p.onSaveProviderKey(spec.id)}
              onRemove={() => p.onRemoveProviderKey(spec.id)}
            />
          );
        })}
      </div>

    </div>
  );
}

// ---- Rows ------------------------------------------------------------------

type OutletRowProps = {
  t: TFunction;
  first: boolean;
  on: boolean;
  canManage: boolean;
  name: string;
  tagline: string;
  meta: string;
  weight: number;
  customTint?: boolean;
  onToggle: () => void;
  onRemove?: () => void;
};

function OutletRow(r: OutletRowProps) {
  return (
    <div style={{
      ...rowFrameStyle,
      borderTop: r.first ? 0 : rowFrameStyle.borderTop,
      display: "grid",
      gridTemplateColumns: "24px 1.6fr 150px 1fr 110px",
      gap: 12,
      alignItems: "center",
      background: r.customTint ? "color-mix(in oklab, var(--ab-green) 5%, transparent)" : "transparent",
    }}>
      <button
        type="button"
        onClick={r.onToggle}
        disabled={!r.canManage}
        aria-pressed={r.on}
        style={{
          width: 18, height: 18, borderRadius: 4,
          border: `1.5px solid ${r.on ? "var(--ab-green)" : "var(--ab-ink)"}`,
          background: r.on ? "var(--ab-green)" : "transparent",
          cursor: r.canManage ? "pointer" : "not-allowed",
          color: "#fff", fontSize: 11, fontWeight: 700,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          opacity: r.canManage ? 1 : 0.5,
        }}
      >{r.on && "✓"}</button>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
        <code className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)" }}>{r.tagline}</code>
      </div>
      <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-soft)", letterSpacing: "0.04em" }}>
        {r.meta}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 4, background: "var(--ab-rule-soft)", borderRadius: 2, position: "relative" }}>
          <div style={{
            position: "absolute", inset: 0,
            width: `${(r.weight ?? 0) * 100}%`,
            background: r.on ? "var(--ab-green)" : "var(--ab-ink)",
            opacity: r.on ? 1 : 0.45, borderRadius: 2,
          }} />
        </div>
        <span className="a-mono" style={{ fontSize: 11, color: "var(--ab-ink-soft)" }}>
          {(r.weight ?? 0).toFixed(2)}
        </span>
      </div>
      <div style={{ justifySelf: "flex-end", display: "flex", gap: 8, alignItems: "center" }}>
        {r.onRemove && r.canManage && (
          <button
            type="button"
            onClick={r.onRemove}
            className="a-mono"
            style={{
              fontSize: 10, letterSpacing: "0.04em",
              border: "1px solid var(--ab-rule)", background: "transparent",
              padding: "2px 7px", cursor: "pointer", color: "var(--ab-ink-soft)",
              borderRadius: 4,
            }}
          >
            {r.t("sources.removeCustom")}
          </button>
        )}
        <TagPill on={r.on} text={r.on ? r.t("sources.trusted") : r.t("sources.available")} />
      </div>
    </div>
  );
}

function GoogleNewsRow({
  t,
  on,
  disabled,
  onToggle,
}: {
  t: TFunction;
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{
      ...rowFrameStyle,
      display: "grid",
      gridTemplateColumns: "24px 1.6fr 150px 1fr 110px",
      gap: 12,
      alignItems: "center",
      background: "var(--ab-paper-2)",
    }}>
      {/* leftmost cell intentionally empty — aggregators use the right-side toggle */}
      <span aria-hidden="true" />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{t("sources.webSearch.googleNews")}</div>
        <span style={{ fontSize: 11.5, color: "var(--ab-ink-mute)" }}>{t("sources.webSearch.googleNewsBlurb")}</span>
      </div>
      <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-soft)", letterSpacing: "0.04em" }}>
        {t("sources.webSearch.googleNewsRegion").toUpperCase()}
      </span>
      <span className="a-mono" style={{ fontSize: 11, color: "var(--ab-ink-mute)" }}>—</span>
      <div style={{ justifySelf: "flex-end" }}>
        <TogglePill t={t} on={on} disabled={disabled} onClick={onToggle} />
      </div>
    </div>
  );
}

function TogglePill({
  t,
  on,
  disabled,
  onClick,
}: {
  t: TFunction;
  on: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "4px 4px 4px 11px", borderRadius: 999,
        border: `1px solid ${on ? "var(--ab-green)" : "var(--ab-rule)"}`,
        background: on ? "color-mix(in oklab, var(--ab-green) 12%, transparent)" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span className="a-mono" style={{
        fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600,
        color: on ? "var(--ab-green-deep)" : "var(--ab-ink-mute)",
      }}>
        {on ? t("sources.webSearch.on") : t("sources.webSearch.off")}
      </span>
      <span style={{
        width: 24, height: 14, borderRadius: 999,
        background: on ? "var(--ab-green)" : "var(--ab-rule)",
        position: "relative", transition: "background .15s",
      }}>
        <span style={{
          position: "absolute", top: 2, left: on ? 12 : 2,
          width: 10, height: 10, borderRadius: "50%",
          background: "var(--ab-paper)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          transition: "left .15s",
        }} />
      </span>
    </button>
  );
}

type ProviderRowProps = {
  t: TFunction;
  spec: NewsProviderSpec;
  hasKey: boolean;
  draft: string;
  flash: boolean;
  canManage: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onRemove: () => void;
};

function ProviderRow({
  t, spec, hasKey, draft, flash, canManage,
  onDraftChange, onSave, onRemove,
}: ProviderRowProps) {
  const [open, setOpen] = useState(hasKey);
  // Auto-open the inline key editor when the user has not yet configured one
  // — saves a click compared to "open" then "enter key".
  const showInline = open || draft !== "";
  return (
    <div style={{
      ...rowFrameStyle,
      display: "grid",
      gridTemplateColumns: "24px 1.6fr 150px 1fr 110px",
      gap: 12,
      alignItems: "center",
    }}>
      {/* leftmost cell intentionally empty — aggregators use the right-side toggle */}
      <span aria-hidden="true" />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{spec.name}</div>
        <span style={{ fontSize: 11.5, color: "var(--ab-ink-mute)" }}>{spec.blurb}</span>
      </div>
      <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-soft)", letterSpacing: "0.04em" }}>
        {t(`providers.body${spec.body_access === "full" ? "Full" : spec.body_access === "metadata" ? "Metadata" : "Snippet"}` as never).toUpperCase()}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {showInline ? (
          <>
            <input
              type="password"
              value={draft}
              disabled={!canManage}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canManage) onSave(); }}
              placeholder={hasKey ? "••••••••" : t("providers.placeholder")}
              autoComplete="off"
              spellCheck={false}
              className="a-input a-mono"
              style={{
                flex: 1, minWidth: 0,
                padding: "6px 9px", fontSize: 11, borderRadius: 6,
                border: "1px solid color-mix(in oklab, var(--ab-ink) 28%, transparent)",
                background: "var(--ab-paper-2)",
              }}
            />
            <button
              type="button"
              onClick={onSave}
              disabled={!canManage || !draft.trim()}
              style={{
                padding: "5px 9px", fontSize: 11, borderRadius: 5,
                border: "1px solid var(--ab-ink)",
                background: "var(--ab-ink)", color: "var(--ab-paper)",
                opacity: canManage && draft.trim() ? 1 : 0.45,
                cursor: canManage && draft.trim() ? "pointer" : "not-allowed",
              }}
            >
              {flash ? t("model.saved") : t("model.save")}
            </button>
            {hasKey && (
              <button
                type="button"
                onClick={onRemove}
                disabled={!canManage}
                className="a-mono"
                style={{
                  padding: "4px 7px", fontSize: 10, letterSpacing: "0.04em",
                  border: "1px solid var(--ab-rule)", background: "transparent",
                  cursor: canManage ? "pointer" : "not-allowed",
                  color: "var(--ab-accent)", borderRadius: 4,
                }}
              >
                {t("model.remove")}
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!canManage}
            className="a-mono"
            style={{
              padding: "4px 9px", fontSize: 10.5, letterSpacing: "0.04em",
              border: "1px solid var(--ab-rule)", background: "transparent",
              cursor: canManage ? "pointer" : "not-allowed",
              color: "var(--ab-ink-soft)", borderRadius: 5,
            }}
          >
            + {t("sources.addKey")}
          </button>
        )}
      </div>
      <div style={{ justifySelf: "flex-end", display: "flex", gap: 8, alignItems: "center" }}>
        <a
          href={spec.signup_url}
          target="_blank"
          rel="noreferrer"
          className="a-mono"
          title={t("providers.getKey")}
          style={{
            fontSize: 9.5, letterSpacing: "0.04em", color: "var(--ab-ink-mute)",
            textTransform: "uppercase",
            textDecoration: "underline",
            textDecorationColor: "color-mix(in oklab, var(--ab-ink) 24%, transparent)",
          }}
        >
          {t("providers.getKey")}
        </a>
        <TogglePill
          t={t}
          on={hasKey}
          disabled={!canManage}
          onClick={() => {
            if (hasKey) {
              onRemove();
            } else {
              setOpen(true);
            }
          }}
        />
      </div>
    </div>
  );
}

function SectionBand({
  label,
  count,
  subtitle,
  asHeader = false,
}: {
  label: string;
  count: number;
  subtitle?: string;
  asHeader?: boolean;
}) {
  return (
    <div style={{
      padding: "12px 16px 11px",
      background: "var(--ab-paper-2)",
      borderTop: asHeader ? 0 : "1px solid var(--ab-rule)",
      borderBottom: "1px solid var(--ab-rule)",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
    }}>
      <div style={{ minWidth: 0 }}>
        <div className="a-mono" style={{
          fontSize: 10, letterSpacing: "0.10em", textTransform: "uppercase",
          fontWeight: 600, color: "var(--ab-ink-soft)",
        }}>{label}</div>
        {subtitle && (
          <div style={{ fontSize: 11.5, color: "var(--ab-ink-mute)", marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      <span className="a-mono" style={{
        padding: "2px 9px", borderRadius: 999, fontSize: 9.5, letterSpacing: "0.06em", fontWeight: 600,
        background: "transparent", color: "var(--ab-ink-soft)",
        border: "1px solid var(--ab-rule)",
      }}>{count}</span>
    </div>
  );
}

function TagPill({ on, text }: { on: boolean; text: string }) {
  return (
    <span className="a-mono" style={{
      padding: "2px 9px", borderRadius: 999, fontSize: 10,
      letterSpacing: "0.04em", fontWeight: 600,
      background: on ? "var(--ab-green-soft)" : "transparent",
      color: on ? "var(--ab-green-deep)" : "var(--ab-ink-mute)",
      border: on
        ? "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)"
        : "1px solid var(--ab-rule)",
    }}>
      {text.toUpperCase()}
    </span>
  );
}
