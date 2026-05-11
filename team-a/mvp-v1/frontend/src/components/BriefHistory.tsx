import { Clock3, ExternalLink, FolderOpen, Trash2, UserRoundCheck } from "lucide-react";
import { formatDate, type Language, type TFunction } from "../i18n";
import type { BriefResponse } from "../types";

type BriefHistoryProps = {
  briefs: BriefResponse[];
  canDelete: boolean;
  language: Language;
  t: TFunction;
  onOpenBrief: (briefId: string) => void;
  onDeleteBrief: (briefId: string) => void;
};

export function BriefHistory({ briefs, canDelete, language, t, onOpenBrief, onDeleteBrief }: BriefHistoryProps) {
  return (
    <section className="history-page" id="brief-history" aria-label={t("history.title")}>
      <div className="history-head">
        <div>
          <span className="command-title">
            <FolderOpen size={16} />
            {t("history.title")}
          </span>
          <p className="section-copy">{t("history.copy")}</p>
        </div>
        <span className="badge neutral">{t("history.count", { count: briefs.length })}</span>
      </div>

      <div className="history-table-shell" role="region" aria-label={t("history.tableLabel")}>
        <div className="history-table" role="table">
          <div className="history-row history-header" role="row">
            <span>{t("history.topic")}</span>
            <span>{t("history.persona")}</span>
            <span>{t("history.coverage")}</span>
            <span>{t("history.created")}</span>
            <span>{t("history.sources")}</span>
            <span>{t("history.actions")}</span>
          </div>

          {briefs.length ? (
            briefs.map((item) => (
              <article className="history-row" role="row" key={item.brief_id}>
                <button className="history-topic-button" type="button" onClick={() => onOpenBrief(item.brief_id)}>
                  <strong>{item.topic}</strong>
                  <small>{item.brief_id}</small>
                </button>
                <span className="history-cell">
                  <UserRoundCheck size={14} />
                  {item.persona_label}
                </span>
                <span className="history-cell history-mode-cell">
                  {item.mode_used === "live" ? t("recent.live") : t("recent.saved")}
                </span>
                <span className="history-cell">
                  <Clock3 size={14} />
                  {formatHistoryDate(item.created_at, language, t)}
                </span>
                <span className="history-cell">{t("report.sources", { count: item.articles.length })}</span>
                <span className="history-actions">
                  <button className="text-link-button history-open-button" type="button" onClick={() => onOpenBrief(item.brief_id)}>
                    <ExternalLink size={15} />
                    {t("history.open")}
                  </button>
                  {canDelete && (
                    <button
                      className="history-delete-button"
                      type="button"
                      aria-label={t("recent.deleteAria", { topic: item.topic })}
                      title={t("recent.deleteTitle")}
                      onClick={() => onDeleteBrief(item.brief_id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </span>
              </article>
            ))
          ) : (
            <div className="history-empty" role="row">
              {t("history.empty")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatHistoryDate(value: string, language: Language, t: TFunction) {
  return formatDate(value, language, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) || t("recent.savedBrief");
}
