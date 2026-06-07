import { FormEvent, useState } from "react";
import type { Language, TFunction } from "../../i18n";
import { localizePersonaById } from "../../i18n";
import { COVERAGE_MODES, PERSONAS } from "../../marketingData";
import { PersonaGlyph, RailIcon } from "../marketing/EditorialIcons";
import type { PersonaLensId } from "../../types";

type Props = {
  topic: string;
  goal: string;
  mode: string;
  persona: string;
  language: Language;
  t: TFunction;
  isLoading: boolean;
  canGenerate: boolean;
  error: string;
  onTopicChange: (v: string) => void;
  onGoalChange: (v: string) => void;
  onModeChange: (v: string) => void;
  onPersonaChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
};

const QUICK_EN = [
  "AI chip export controls",
  "US inflation outlook",
  "Open-source AI model competition",
];
const QUICK_ZH = [
  "AI 芯片出口管制",
  "美国通胀前景",
  "开源 AI 模型竞争",
];

export function WSComposer(p: Props) {
  const [hoverMode, setHoverMode] = useState<string | null>(null);
  const quickList = p.language === "zh"
    ? QUICK_ZH.map((zh, i) => [QUICK_EN[i], zh] as const)
    : QUICK_EN.map((en) => [en, en] as const);

  return (
    <form onSubmit={p.onSubmit} aria-busy={p.isLoading}>
      {/* No card chrome — the composer sits directly on the page like the
          History and Sources views; its inner controls carry their own
          borders, so an outer panel border is redundant. */}
      <section style={{ marginBottom: 28 }}>
        {/* Topic row */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "stretch" }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 18px", borderRadius: 9,
              background: "var(--ab-paper)",
              border: "1px solid var(--ab-green)",
              boxShadow: "0 0 0 4px color-mix(in oklab, var(--ab-green) 12%, transparent)",
              cursor: "text",
            }}>
              <span style={{ color: "var(--ab-green)", display: "inline-flex" }}><RailIcon kind="search" /></span>
              <input
                type="text"
                value={p.topic}
                onChange={(e) => p.onTopicChange(e.target.value)}
                placeholder={p.t("composer.topicPlaceholder")}
                required
                className="a-input"
                style={{
                  fontFamily: "var(--ab-font-display)", fontSize: 20, fontWeight: 600,
                  letterSpacing: "-0.012em", minWidth: 0, width: "100%",
                  border: 0, background: "transparent", outline: "none",
                }}
              />
            </label>
            <button
              type="submit"
              disabled={p.isLoading || !p.canGenerate}
              title={!p.canGenerate ? p.t("sources.viewerNotice") : ""}
              aria-busy={p.isLoading}
              aria-live="polite"
              className={p.isLoading ? "ws-generate-busy" : undefined}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 24px", borderRadius: 9, border: 0,
                background: "var(--ab-green)", color: "#fff",
                fontFamily: "var(--ab-font-display)", fontSize: 15, fontWeight: 600,
                cursor: p.canGenerate ? "pointer" : "not-allowed",
                opacity: p.canGenerate ? 1 : 0.5,
                boxShadow: "0 12px 22px -10px color-mix(in oklab, var(--ab-green) 75%, transparent)",
              }}
            >
              {p.isLoading ? (
                // Spinning ring: clear "work in progress" semaphore.
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
                     className="ws-generate-spin">
                  <circle cx="7" cy="7" r="5.2" stroke="currentColor" strokeWidth="1.8"
                          strokeOpacity="0.35" />
                  <path d="M12.2 7a5.2 5.2 0 0 0-5.2-5.2" stroke="currentColor" strokeWidth="1.8"
                        strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 1.5l1.4 3.2 3.1 1.4-3.1 1.4L7 10.7l-1.4-3.2-3.1-1.4 3.1-1.4z" fill="currentColor"/>
                </svg>
              )}
              {p.isLoading ? (
                // Inline animated ellipsis after the localized verb.
                <span className="ws-generate-dots">{p.t("composer.generating")}</span>
              ) : (
                p.t("composer.generate")
              )}
            </button>
          </div>
        </div>

        {/* Goal pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "11px 16px", borderRadius: 9,
          background: "var(--ab-paper-2)", border: "1px solid var(--ab-rule)",
          marginBottom: 24,
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="7" cy="7" r="2" fill="currentColor"/>
          </svg>
          <input
            type="text"
            value={p.goal}
            onChange={(e) => p.onGoalChange(e.target.value)}
            placeholder={p.t("composer.goalPlaceholder")}
            className="a-input"
            style={{ fontSize: 13.5, color: "var(--ab-ink-soft)", border: 0, background: "transparent", outline: "none", width: "100%" }}
          />
        </div>

        {/* Persona lens grid */}
        <div style={{ marginBottom: 12 }}>
          <span className="a-smallcaps">{p.t("persona.title")}</span>
          <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ab-ink-mute)", margin: "5px 0 0", maxWidth: 560 }}>
            {p.t("persona.helper")}
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {PERSONAS.map((pp) => {
            const sel = p.persona === pp.value;
            const loc = localizePersonaById(pp.value as PersonaLensId, p.language, { label: pp.label, short: pp.short });
            return (
              <button
                key={pp.value}
                type="button"
                onClick={() => p.onPersonaChange(pp.value)}
                aria-pressed={sel}
                style={{
                  textAlign: "left", padding: "13px 13px 14px", borderRadius: 9, cursor: "pointer",
                  background: sel ? "var(--ab-paper-2)" : "var(--ab-paper)",
                  border: `1px solid ${sel ? "var(--ab-ink)" : "var(--ab-rule)"}`,
                  transition: "border-color .15s ease, background .15s ease",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: sel ? "var(--ab-ink)" : "var(--ab-paper-2)",
                  color: sel ? "var(--ab-paper)" : "var(--ab-ink)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
                }}>
                  <PersonaGlyph value={pp.value as PersonaLensId} />
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25 }}>{loc.label}</div>
                <div style={{ fontSize: 10.5, color: "var(--ab-ink-soft)", marginTop: 4, lineHeight: 1.4 }}>
                  {loc.short}
                </div>
              </button>
            );
          })}
        </div>

        {/* Coverage + quick topics strip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          marginTop: 22, paddingTop: 18,
          borderTop: "1px solid var(--ab-rule-soft)", flexWrap: "wrap",
        }}>
          <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.08em" }}>
            {p.t("composer.coverage").toUpperCase()}
          </span>
          <div
            style={{
              display: "inline-flex", border: "1px solid var(--ab-rule)",
              borderRadius: 7, overflow: "visible",
            }}
            onMouseLeave={() => setHoverMode(null)}
          >
            {COVERAGE_MODES.map((cm, idx) => {
              const sel = p.mode === cm.value;
              const hovered = hoverMode === cm.value;
              return (
                <div
                  key={cm.value}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    borderLeft: idx > 0 ? "1px solid var(--ab-rule)" : 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => p.onModeChange(cm.value)}
                    onMouseEnter={() => setHoverMode(cm.value)}
                    onFocus={() => setHoverMode(cm.value)}
                    onBlur={() => setHoverMode(null)}
                    style={{
                      padding: "6px 13px", cursor: "pointer", border: 0,
                      background: sel ? "var(--ab-ink)" : "transparent",
                      color: sel ? "var(--ab-paper)" : "var(--ab-ink-soft)",
                      fontFamily: "var(--ab-font-mono)", fontSize: 11,
                      letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600,
                    }}
                  >
                    {p.t(`coverage.${cm.value}.label` as never)}
                  </button>
                  {hovered && (
                    <div
                      role="tooltip"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 10px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        minWidth: 240,
                        maxWidth: 300,
                        padding: "11px 14px 12px",
                        background: "var(--ab-paper)",
                        color: "var(--ab-ink)",
                        border: "1px solid var(--ab-ink)",
                        borderRadius: 8,
                        boxShadow: "0 18px 38px -18px rgba(0,0,0,0.22)",
                        zIndex: 30,
                        pointerEvents: "none",
                      }}
                    >
                      {/* arrow — paper square clipped by ink borders so it reads as part of the card */}
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          top: -6,
                          left: "50%",
                          transform: "translateX(-50%) rotate(45deg)",
                          width: 10,
                          height: 10,
                          background: "var(--ab-paper)",
                          borderTop: "1px solid var(--ab-ink)",
                          borderLeft: "1px solid var(--ab-ink)",
                        }}
                      />
                      <div
                        className="a-mono"
                        style={{
                          fontSize: 9.5, letterSpacing: "0.08em",
                          textTransform: "uppercase", color: "var(--ab-ink-mute)",
                          marginBottom: 4,
                        }}
                      >
                        {p.t("composer.coverage")}
                      </div>
                      <div
                        className="a-serif"
                        style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}
                      >
                        {p.t(`coverage.${cm.value}.label` as never)}
                      </div>
                      <p
                        style={{
                          fontSize: 12, lineHeight: 1.55, margin: 0,
                          color: "var(--ab-ink-soft)",
                        }}
                      >
                        {p.t(`coverage.${cm.value}.blurb` as never)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <span style={{ flex: 1 }} />
          <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.06em" }}>
            {p.t("composer.quickTopics").toUpperCase()}
          </span>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {quickList.map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => p.onTopicChange(val)}
                className="a-mono"
                style={{
                  padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                  border: "1px solid var(--ab-rule)", background: "transparent",
                  fontSize: 11, color: "var(--ab-ink-soft)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {!p.canGenerate && (
          <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--ab-accent)" }}>
            {p.t("sources.viewerNotice")}
          </p>
        )}
      </section>

      {p.error && (
        <div role="alert" style={{
          marginBottom: 24, padding: "12px 14px",
          border: "1px solid color-mix(in oklab, var(--ab-accent) 40%, transparent)",
          background: "color-mix(in oklab, var(--ab-accent) 8%, transparent)",
          color: "var(--ab-accent)", borderRadius: 8, fontSize: 13,
        }}>
          {p.error}
        </div>
      )}
    </form>
  );
}
