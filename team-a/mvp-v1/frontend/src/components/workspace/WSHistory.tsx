import { formatDate, localizePersonaById, type Language, type TFunction } from "../../i18n";
import type { BriefResponse, PersonaLensId } from "../../types";

type Props = {
  briefs: BriefResponse[];
  canDelete: boolean;
  language: Language;
  t: TFunction;
  onOpenBrief: (briefId: string) => void;
  onDeleteBrief: (briefId: string) => void;
};

const COLS = "1.7fr 1fr 96px 150px 78px 110px";

export function WSHistory({ briefs, canDelete, language, t, onOpenBrief, onDeleteBrief }: Props) {
  const fmt = (iso: string) =>
    formatDate(iso, language, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div style={{ padding: "40px 56px 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div className="a-smallcaps">{t("history.title")}</div>
          <h2 className="a-serif" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 6 }}>
            {t("history.heading")}
          </h2>
        </div>
        <span className="a-mono" style={{
          padding: "2px 9px", borderRadius: 999, fontSize: 10,
          letterSpacing: "0.04em", fontWeight: 600,
          background: "transparent", color: "var(--ab-ink-soft)",
          border: "1px solid var(--ab-rule)",
        }}>{t("history.count", { count: briefs.length }).toUpperCase()}</span>
      </div>
      <p style={{ fontSize: 13, color: "var(--ab-ink-soft)", marginBottom: 16 }}>{t("history.copy")}</p>

      <div style={{ border: "1px solid var(--ab-rule)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: COLS, padding: "10px 16px",
          background: "var(--ab-paper-2)", borderBottom: "1px solid var(--ab-rule)",
          fontFamily: "var(--ab-font-mono)", fontSize: 10, letterSpacing: "0.08em",
          color: "var(--ab-ink-mute)", textTransform: "uppercase",
        }}>
          <span>{t("history.topic")}</span>
          <span>{t("history.persona")}</span>
          <span>{t("history.coverage")}</span>
          <span>{t("history.created")}</span>
          <span>{t("history.sources")}</span>
          <span style={{ textAlign: "right" }}>{t("history.actions")}</span>
        </div>

        {briefs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ab-ink-soft)", fontSize: 13 }}>
            {t("history.empty")}
          </div>
        ) : briefs.map((b, i) => {
          const personaLabel = b.persona
            ? localizePersonaById(b.persona as PersonaLensId, language, { label: b.persona_label || "", short: "" }).label
            : "";
          const isLive = b.mode_used !== "fallback";
          return (
            <div key={b.brief_id} style={{
              display: "grid", gridTemplateColumns: COLS, padding: "12px 16px",
              alignItems: "center",
              borderBottom: i < briefs.length - 1 ? "1px solid var(--ab-rule-soft)" : 0,
              background: i === 0 ? "color-mix(in oklab, var(--ab-green) 6%, transparent)" : "transparent",
            }}>
              <button type="button" onClick={() => onOpenBrief(b.brief_id)} style={{
                display: "block", padding: 0, border: 0, background: "transparent",
                textAlign: "left", cursor: "pointer",
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{b.topic}</div>
                <code className="a-mono" style={{ fontSize: 10, color: "var(--ab-ink-mute)" }}>{b.brief_id}</code>
              </button>
              <span style={{ fontSize: 12.5, color: personaLabel ? "var(--ab-ink-soft)" : "var(--ab-ink-mute)" }}>
                {personaLabel || t("history.notSet")}
              </span>
              <span>
                <span className="a-mono" style={{
                  padding: "2px 9px", borderRadius: 999, fontSize: 10,
                  letterSpacing: "0.04em", fontWeight: 600,
                  background: isLive ? "var(--ab-green-soft)" : "transparent",
                  color: isLive ? "var(--ab-green-deep)" : "var(--ab-ink-soft)",
                  border: isLive
                    ? "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)"
                    : "1px solid var(--ab-rule)",
                }}>
                  {(isLive ? t("report.live") : t("report.saved")).toUpperCase()}
                </span>
              </span>
              <span className="a-mono" style={{ fontSize: 11, color: "var(--ab-ink-soft)" }}>{fmt(b.created_at)}</span>
              <span style={{ fontSize: 12.5, color: "var(--ab-ink-soft)" }}>{b.articles.length}</span>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => onOpenBrief(b.brief_id)}
                  className="a-btn a-btn-ghost"
                  style={{ padding: "4px 9px", fontSize: 11 }}
                >
                  {t("history.open")} →
                </button>
                <button
                  type="button"
                  disabled={!canDelete}
                  onClick={() => canDelete && onDeleteBrief(b.brief_id)}
                  title={!canDelete ? t("history.deleteGated") : t("history.delete")}
                  style={{
                    padding: "4px 8px", fontSize: 11,
                    border: "1px solid var(--ab-rule)", background: "transparent",
                    cursor: canDelete ? "pointer" : "not-allowed",
                    color: canDelete ? "var(--ab-accent)" : "var(--ab-ink-mute)",
                    opacity: canDelete ? 1 : 0.6,
                  }}
                >
                  {t("history.delete")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {!canDelete && (
        <p className="a-mono" style={{
          marginTop: 10, fontSize: 10.5, color: "var(--ab-ink-mute)", letterSpacing: "0.04em",
        }}>
          {t("history.deleteGated")}
        </p>
      )}
    </div>
  );
}
