import type { ReactNode } from "react";
import { formatDate, type Language, type TFunction, type TranslationKey } from "../../i18n";
import type { BriefResponse } from "../../types";
import { PersonaGlyph, RailIcon } from "../marketing/EditorialIcons";

type Props = {
  brief: BriefResponse;
  language: Language;
  t: TFunction;
  hasKey: boolean;
  canHandoff: boolean;
};

function Tag({ children, accent, muted }: { children: ReactNode; accent?: boolean; muted?: boolean }) {
  return (
    <span className="a-mono" style={{
      padding: "2px 9px", borderRadius: 999, fontSize: 10,
      letterSpacing: "0.04em", fontWeight: 600,
      background: accent ? "var(--ab-green-soft)" : "transparent",
      color: accent ? "var(--ab-green-deep)" : (muted ? "var(--ab-ink-mute)" : "var(--ab-ink-soft)"),
      border: accent ? "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)" : "1px solid var(--ab-rule)",
    }}>{children}</span>
  );
}

function MetaPill({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ab-ink-soft)" }}>
      {children}
    </span>
  );
}

function ScorePill({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <span className="a-mono" style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 7px", borderRadius: 4,
      border: "1px solid var(--ab-rule)", background: "var(--ab-paper-2)",
      fontSize: 10, letterSpacing: "0.04em", color: "var(--ab-ink-soft)",
    }}>
      <span style={{ color: "var(--ab-ink-mute)" }}>{label}</span>
      <span style={{ color: accent ? "var(--ab-green)" : "var(--ab-ink)", fontWeight: 600 }}>
        {value.toFixed(2)}
      </span>
    </span>
  );
}

export function WSReport({ brief, language, t, hasKey, canHandoff }: Props) {
  const titles = brief.section_titles || {};
  const sectionTitle = (v: string | undefined, k: TranslationKey) =>
    (language === "zh" ? t(k) : v || t(k));

  const watchItems = brief.risk_notes.length ? brief.risk_notes : brief.uncertainties;
  const isHeuristic = brief.section_generation_mode === "heuristic";
  const modeLabel = brief.mode_used === "live" ? t("report.live") : t("report.saved");
  const articles = brief.articles;

  const insightCols: Array<[string, string[], boolean]> = [
    [sectionTitle(titles.takeaways, "report.takeaways"), brief.key_takeaways, false],
    [sectionTitle(titles.facts, "report.keyFacts"), brief.key_facts, false],
    [sectionTitle(titles.insights, "report.signals"), brief.insights, false],
    [sectionTitle(titles.watch, "report.watch"), watchItems, true],
  ];

  return (
    <article style={{ border: "1px solid var(--ab-rule)", borderRadius: 10, overflow: "hidden", background: "var(--ab-paper)" }}>
      {/* Header band */}
      <header style={{
        padding: "20px 24px 18px", borderBottom: "1px solid var(--ab-rule)",
        display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "flex-start",
      }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <Tag>{t("report.mode").toUpperCase()} · {modeLabel.toUpperCase()}</Tag>
            <Tag>{t("report.sectionsMode").toUpperCase()} · {(hasKey && !isHeuristic ? t("report.llm") : t("report.heuristic")).toUpperCase()}</Tag>
          </div>
          <h2 className="a-serif" style={{
            fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em",
            lineHeight: 1.1, margin: 0,
          }}>{brief.topic}</h2>
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            <MetaPill><PersonaGlyph value={brief.persona} /> {brief.persona_label}</MetaPill>
            <MetaPill>{t("report.sources", { count: articles.length })}</MetaPill>
            <MetaPill><RailIcon kind="radio" /> {modeLabel}</MetaPill>
            <MetaPill>
              <span className="a-mono" style={{ fontSize: 11 }}>
                {formatDate(brief.created_at, language)} UTC
              </span>
            </MetaPill>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <a href={`/briefs/${brief.brief_id}/export`} className="a-btn a-btn-ghost" style={{ padding: "7px 12px", fontSize: 12.5 }}>HTML</a>
          <a href={`/briefs/${brief.brief_id}/export.md`} className="a-btn a-btn-ghost" style={{ padding: "7px 12px", fontSize: 12.5 }}>MD</a>
          {canHandoff ? (
            <a href={`/briefs/${brief.brief_id}/handoff`} className="a-btn a-btn-ghost" style={{ padding: "7px 12px", fontSize: 12.5 }}>JSON</a>
          ) : (
            <span title={t("history.deleteGated")} className="a-btn a-btn-ghost" style={{
              padding: "7px 12px", fontSize: 12.5, opacity: 0.5, cursor: "not-allowed",
              display: "inline-flex", gap: 6,
            }}>
              JSON
              <span className="a-mono" style={{
                fontSize: 9, border: "1px solid var(--ab-rule)", borderRadius: 3, padding: "0 4px",
              }}>{t("report.adminOnly").toUpperCase()}</span>
            </span>
          )}
        </nav>
      </header>

      {/* Body band: summary | confidence sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px" }}>
        <div style={{ padding: "20px 24px", borderRight: "1px solid var(--ab-rule)" }}>
          <div className="a-mono" style={{
            fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.08em", marginBottom: 8,
          }}>
            {sectionTitle(titles.summary, "report.executiveSummary").toUpperCase()}
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
            {brief.executive_summary || brief.overview}
          </p>
          {brief.goal && (
            <div style={{
              marginTop: 16, padding: "10px 12px", background: "var(--ab-paper-2)",
              borderRadius: 7, display: "flex", alignItems: "center", gap: 8,
              fontSize: 12.5, color: "var(--ab-ink-soft)",
            }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="7" cy="7" r="2" fill="currentColor"/>
              </svg>
              <span style={{ fontStyle: "italic" }}>{t("report.goal")} · {brief.goal}</span>
            </div>
          )}
          {brief.warnings.length > 0 && isHeuristic && (
            <div style={{
              marginTop: 12, padding: "10px 12px",
              border: "1px solid color-mix(in oklab, var(--ab-accent) 30%, transparent)",
              background: "color-mix(in oklab, var(--ab-accent) 7%, transparent)",
              borderRadius: 7,
            }}>
              <div className="a-mono" style={{
                fontSize: 9.5, color: "var(--ab-accent)", letterSpacing: "0.08em", marginBottom: 4,
              }}>{t("report.warnings").toUpperCase()}</div>
              <div className="a-mono" style={{ fontSize: 11, color: "var(--ab-ink-soft)" }}>
                {brief.warnings.join(" · ")}
              </div>
            </div>
          )}
        </div>
        <aside style={{ padding: "20px 18px", background: "var(--ab-paper-2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.08em" }}>
              {t("report.confidence").toUpperCase()}
            </span>
            <Tag accent>{brief.confidence.level.toUpperCase()}</Tag>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span className="a-serif" style={{
              fontSize: 44, fontWeight: 600, lineHeight: 1,
              color: "var(--ab-green)", letterSpacing: "-0.02em",
            }}>{brief.confidence.score}</span>
            <div style={{ flex: 1, height: 6, background: "var(--ab-rule-soft)", borderRadius: 3, position: "relative" }}>
              <div style={{
                position: "absolute", inset: 0,
                width: `${Math.max(0, Math.min(100, brief.confidence.score))}%`,
                background: "var(--ab-green)", borderRadius: 3,
              }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
            {[
              [t("history.sources"), brief.confidence.source_diversity],
              [t("report.freshLabel"), brief.confidence.freshness],
              [t("report.fitLabel"), brief.confidence.topic_fit],
            ].map(([k, v]) => (
              <div key={k as string} style={{
                padding: "6px 8px", background: "var(--ab-paper)",
                border: "1px solid var(--ab-rule)", borderRadius: 6,
              }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{v}</div>
                <div className="a-mono" style={{
                  fontSize: 9.5, color: "var(--ab-ink-mute)", letterSpacing: "0.04em", marginTop: 1,
                }}>{(k as string).toUpperCase()}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {articles.slice(0, 3).map((a, i) => (
              <div key={a.id} style={{
                display: "grid", gridTemplateColumns: "1fr 60px 28px",
                gap: 8, alignItems: "center", fontSize: 12,
              }}>
                <span style={{ fontWeight: 500 }}>{a.source}</span>
                <div style={{ height: 4, background: "var(--ab-rule-soft)", borderRadius: 2, position: "relative" }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    width: `${a.total_score * 100}%`,
                    background: i === 0 ? "var(--ab-green)" : "var(--ab-ink)",
                    opacity: i === 0 ? 1 : 0.55, borderRadius: 2,
                  }} />
                </div>
                <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)", textAlign: "right" }}>
                  {a.total_score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Insight grid */}
      <div style={{ borderTop: "1px solid var(--ab-rule)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {insightCols.map(([title, items, muted], ci) => (
          <div key={ci} style={{
            padding: "16px 18px", borderLeft: ci ? "1px solid var(--ab-rule)" : 0,
          }}>
            <div className="a-mono" style={{
              fontSize: 10, color: "var(--ab-ink-mute)", letterSpacing: "0.08em", marginBottom: 10,
            }}>{title.toUpperCase()}</div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
              {items.map((it, i) => (
                <li key={i} style={{
                  fontSize: 12.5, lineHeight: 1.5,
                  color: muted ? "var(--ab-ink-soft)" : "var(--ab-ink)",
                  paddingLeft: 14, position: "relative",
                }}>
                  <span style={{
                    position: "absolute", left: 0, top: 7, width: 4, height: 4,
                    borderRadius: "50%",
                    background: muted ? "var(--ab-ink-mute)" : "var(--ab-green)",
                  }} />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Comparison note */}
      <div style={{ borderTop: "1px solid var(--ab-rule)", padding: "18px 24px", background: "var(--ab-paper-2)" }}>
        <div className="a-mono" style={{
          fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.08em", marginBottom: 6,
        }}>{sectionTitle(titles.note, "report.coverageNote").toUpperCase()}</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{brief.framing_comparison}</p>
      </div>

      {/* Source evidence list */}
      <div style={{ borderTop: "1px solid var(--ab-rule)", padding: "18px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 className="a-serif" style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
            {t("report.sourceEvidence")}
          </h3>
          <span className="a-mono" style={{ fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.06em" }}>
            {t("report.selected", { count: articles.length }).toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {articles.map((a, i) => {
            const n = String(i + 1).padStart(2, "0");
            const why = a.summary || a.snippet || "";
            return (
              <div key={a.id} style={{
                display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 14,
                padding: "12px 14px", border: "1px solid var(--ab-rule)", borderRadius: 9,
                background: i === 0 ? "var(--ab-paper-2)" : "var(--ab-paper)",
              }}>
                <span className="a-mono" style={{
                  fontSize: 11, color: "var(--ab-ink-mute)", letterSpacing: "0.06em",
                }}>{n}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{a.title}</div>
                  <div className="a-mono" style={{
                    fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.04em", marginBottom: 8,
                  }}>
                    {a.source.toUpperCase()}{a.published_at ? ` · ${formatDate(a.published_at, language) || ""} UTC` : ""}
                  </div>
                  {why && (
                    <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ab-ink-soft)", fontStyle: "italic", margin: 0 }}>
                      "{why}"
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <ScorePill label={t("report.rankLabel")} value={a.total_score} accent={i === 0} />
                    <ScorePill label={t("report.freshLabel")} value={a.freshness_score} />
                    <ScorePill label={t("report.fitLabel")} value={a.match_score} />
                  </div>
                </div>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="a-btn a-btn-ghost"
                  style={{ alignSelf: "flex-start", padding: "5px 9px", fontSize: 11.5 }}
                >
                  {t("report.openSource")}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
