import { Database, FileText, GitCompareArrows, Link, Radar } from "lucide-react";
import type { TFunction } from "../i18n";

type EmptyStateProps = {
  t: TFunction;
};

export function EmptyState({ t }: EmptyStateProps) {
  return (
    <article className="empty-state">
      <div className="empty-copy-block">
        <div className="report-kicker">
          <span className="badge success">{t("report.ready")}</span>
          <span className="badge neutral">
            <Database size={15} />
            {t("empty.sourceAware")}
          </span>
        </div>
        <h2>{t("empty.ready")}</h2>
        <p>{t("empty.copy")}</p>
        <div className="capability-row" aria-label={t("empty.capabilities")}>
          <span>
            <Link size={15} />
            {t("empty.evidence")}
          </span>
          <span>
            <GitCompareArrows size={15} />
            {t("empty.comparison")}
          </span>
          <span>
            <Radar size={15} />
            {t("empty.watch")}
          </span>
          <span>
            <FileText size={15} />
            {t("empty.exports")}
          </span>
        </div>
      </div>
      <aside className="empty-preview" aria-hidden="true">
        <div className="preview-line strong" />
        <div className="preview-line" />
        <div className="preview-line short" />
        <div className="preview-meter">
          <span />
        </div>
      </aside>
    </article>
  );
}
