import { useState } from "react";
import type { TFunction } from "../../i18n";
import type {
  CustomTrustedSource,
  SourceCatalogItem,
  TrustedSourceSettings,
} from "../../types";

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
};

const COLS = "24px 1.7fr 150px 64px 1fr 100px";

export function WSSources(p: Props) {
  const [localErr, setLocalErr] = useState("");
  const selectedIds = new Set(p.settings.selected_source_ids);
  const selectedCount = p.settings.selected_source_ids.length + p.settings.custom_sources.length;

  function handleAdd() {
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
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div className="a-smallcaps">{p.t("sources.title")}</div>
          <h2 className="a-serif" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 6 }}>
            {p.t("sources.heading")}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="a-mono" style={{
            padding: "2px 9px", borderRadius: 999, fontSize: 10, letterSpacing: "0.04em", fontWeight: 600,
            border: "1px solid var(--ab-rule)", color: "var(--ab-ink-soft)",
          }}>
            {p.t("sources.trustedCount", { count: selectedCount }).toUpperCase()}
          </span>
          <span className="a-mono" style={{
            padding: "2px 9px", borderRadius: 999, fontSize: 10, letterSpacing: "0.04em", fontWeight: 600,
            background: "var(--ab-green-soft)",
            color: "var(--ab-green-deep)",
            border: "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)",
          }}>
            ● {(p.isSaving ? p.t("sources.autosaving") : p.t("sources.autosaved")).toUpperCase()}
          </span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "var(--ab-ink-soft)", marginBottom: 18, maxWidth: 680 }}>{p.t("sources.copy")}</p>
      {!p.canManage && <p style={{ marginBottom: 14, fontSize: 12.5, color: "var(--ab-accent)" }}>{p.t("sources.viewerNotice")}</p>}
      {p.error && <p style={{ marginBottom: 14, fontSize: 12.5, color: "var(--ab-accent)" }}>{p.error}</p>}

      <div style={{ border: "1px solid var(--ab-rule)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: COLS, padding: "10px 16px", gap: 12,
          background: "var(--ab-paper-2)", borderBottom: "1px solid var(--ab-rule)",
          fontFamily: "var(--ab-font-mono)", fontSize: 10, letterSpacing: "0.08em",
          color: "var(--ab-ink-mute)", textTransform: "uppercase",
        }}>
          <span></span>
          <span>{p.t("sources.col.source")}</span>
          <span>{p.t("sources.col.cat")}</span>
          <span>{p.t("sources.col.feed")}</span>
          <span>{p.t("sources.col.weight")}</span>
          <span style={{ textAlign: "right" }}>{p.t("sources.col.state")}</span>
        </div>

        {p.catalog.map((src, i) => {
          const on = selectedIds.has(src.id);
          return (
            <div key={src.id} style={{
              display: "grid", gridTemplateColumns: COLS, padding: "12px 16px", alignItems: "center", gap: 12,
              borderBottom: i < p.catalog.length - 1 ? "1px solid var(--ab-rule-soft)" : 0,
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
                <code className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)" }}>{src.domain || src.feed_url || ""}</code>
              </div>
              <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-soft)", letterSpacing: "0.04em" }}>
                {(src.category || "").toUpperCase()} · {(src.region || "").toUpperCase()}
              </span>
              <span>
                {src.feed_url ? (
                  <span className="a-mono" style={{
                    padding: "2px 9px", borderRadius: 999, fontSize: 10, letterSpacing: "0.04em", fontWeight: 600,
                    background: "var(--ab-green-soft)", color: "var(--ab-green-deep)",
                    border: "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)",
                  }}>RSS</span>
                ) : (
                  <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)" }}>–</span>
                )}
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
                <span className="a-mono" style={{
                  padding: "2px 9px", borderRadius: 999, fontSize: 10,
                  letterSpacing: "0.04em", fontWeight: 600,
                  background: on ? "var(--ab-green-soft)" : "transparent",
                  color: on ? "var(--ab-green-deep)" : "var(--ab-ink-mute)",
                  border: on
                    ? "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)"
                    : "1px solid var(--ab-rule)",
                }}>
                  {on ? p.t("sources.trusted").toUpperCase() : p.t("sources.available").toUpperCase()}
                </span>
              </span>
            </div>
          );
        })}

        {p.settings.custom_sources.map((src, i) => (
          <div key={src.id || src.name} style={{
            display: "grid", gridTemplateColumns: COLS, padding: "12px 16px", alignItems: "center", gap: 12,
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
            <span>
              {src.feed_url ? (
                <span className="a-mono" style={{
                  padding: "2px 9px", borderRadius: 999, fontSize: 10, letterSpacing: "0.04em", fontWeight: 600,
                  background: "var(--ab-green-soft)", color: "var(--ab-green-deep)",
                  border: "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)",
                }}>RSS</span>
              ) : (
                <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)" }}>–</span>
              )}
            </span>
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
            type="button" onClick={handleAdd} disabled={!p.canManage}
            className="a-btn a-btn-primary"
            style={{ padding: "0 16px", fontSize: 13, cursor: p.canManage ? "pointer" : "not-allowed" }}
          >
            + {p.t("sources.add")}
          </button>
        </div>
        {localErr && <p style={{ marginTop: 10, fontSize: 12.5, color: "var(--ab-accent)" }}>{localErr}</p>}
      </div>

      <div style={{ marginTop: 12, display: "flex", alignItems: "center" }}>
        <span style={{ flex: 1 }} />
        <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.04em" }}>
          PUT /api/trusted-sources
        </span>
      </div>
    </div>
  );
}
