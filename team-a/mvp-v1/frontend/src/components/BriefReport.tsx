import {
  Braces,
  Clock3,
  Database,
  Download,
  ExternalLink,
  FileCode,
  GitCompareArrows,
  Link as LinkIcon,
  RadioTower,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { formatDate, type Language, type TFunction, type TranslationKey } from "../i18n";
import type { BriefResponse } from "../types";

type BriefReportProps = {
  brief: BriefResponse;
  language: Language;
  t: TFunction;
};

export function BriefReport({ brief, language, t }: BriefReportProps) {
  const titles = brief.section_titles || {};
  const riskItems = brief.risk_notes.length ? brief.risk_notes : brief.uncertainties;
  const sectionTitle = (value: string | undefined, key: TranslationKey) => (language === "zh" ? t(key) : value || t(key));

  return (
    <article className="report-card">
      <header className="report-head">
        <div className="report-title-block">
          <div className="report-kicker">
            <span className="badge success">{t("report.ready")}</span>
            {brief.warnings.includes("fallback_used") && <span className="badge warning">{t("report.savedCoverage")}</span>}
          </div>
          <h2 className="report-topic">{brief.topic}</h2>
          <div className="report-meta">
            <span className="meta-pill">
              <UserRoundCheck size={15} />
              {brief.persona_label}
            </span>
            <span className="meta-pill">
              <LinkIcon size={15} />
              {t("report.sources", { count: brief.articles.length })}
            </span>
            <span className="meta-pill">
              <RadioTower size={15} />
              {brief.mode_used === "live" ? t("report.liveCoverage") : t("report.savedCoverage")}
            </span>
            <span className="meta-pill">
              <Clock3 size={15} />
              {formatDate(brief.created_at, language)}
            </span>
          </div>
        </div>
        <nav className="report-actions" aria-label={t("report.actions")}>
          <a className="text-link-button" href={`/briefs/${brief.brief_id}/export`}>
            <FileCode size={16} />
            {t("report.exportHtml")}
          </a>
          <a className="text-link-button" href={`/briefs/${brief.brief_id}/export.md`}>
            <Download size={16} />
            {t("report.exportMarkdown")}
          </a>
          <a className="text-link-button" href={`/briefs/${brief.brief_id}/handoff`}>
            <Braces size={16} />
            {t("report.exportHandoff")}
          </a>
        </nav>
      </header>

      <section className="summary-row">
        <div className="summary-block">
          <h3 className="section-title">{sectionTitle(titles.summary, "report.executiveSummary")}</h3>
          <p>{brief.executive_summary || brief.overview}</p>
          {brief.goal && (
            <p className="goal-note">
              <Target size={16} />
              {brief.goal}
            </p>
          )}
        </div>
        <EvidencePanel brief={brief} t={t} />
      </section>

      <section className="insight-grid">
        <ReportList title={sectionTitle(titles.takeaways, "report.takeaways")} items={brief.key_takeaways} />
        <ReportList title={sectionTitle(titles.facts, "report.keyFacts")} items={brief.key_facts} />
        <ReportList title={sectionTitle(titles.insights, "report.signals")} items={brief.insights} />
        <ReportList title={sectionTitle(titles.watch, "report.watch")} items={riskItems} />
      </section>

      <section className="report-section comparison-note">
        <h3>
          <GitCompareArrows size={16} />
          {sectionTitle(titles.note, "report.coverageNote")}
        </h3>
        <p>{brief.framing_comparison}</p>
      </section>

      <section className="source-list" aria-label={t("report.sourceListLabel")}>
        <div className="section-head compact">
          <h3>{t("report.sourceEvidence")}</h3>
          <span className="source-count">{t("report.selected", { count: brief.articles.length })}</span>
        </div>
        {brief.articles.map((article, index) => (
          <article className="source-row" key={article.id}>
            <div className="source-index">{String(index + 1).padStart(2, "0")}</div>
            <div className="source-main">
              <h4>{article.title}</h4>
              <p className="source-meta">{article.source}</p>
              <p className="source-snippet">{article.summary || article.snippet}</p>
              <div className="score-row">
                <span className="score-pill">{t("report.rank", { score: article.total_score.toFixed(2) })}</span>
                <span className="score-pill">{t("report.fresh", { score: article.freshness_score.toFixed(2) })}</span>
                <span className="score-pill">{t("report.fit", { score: article.match_score.toFixed(2) })}</span>
              </div>
            </div>
            <a className="text-link-button" href={article.url} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              {t("report.source")}
            </a>
          </article>
        ))}
      </section>
    </article>
  );
}

function EvidencePanel({ brief, t }: { brief: BriefResponse; t: TFunction }) {
  return (
    <aside className="evidence-panel">
      <div className="evidence-topline">
        <h3>
          <Database size={18} />
          {t("report.evidence")}
        </h3>
        <span className="badge neutral">{brief.confidence.level}</span>
      </div>
      <div className="evidence-score-row">
        <div className="evidence-number">{brief.confidence.score}</div>
        <span className="evidence-meter" aria-hidden="true">
          <span style={{ width: `${Math.max(0, Math.min(100, brief.confidence.score))}%` }} />
        </span>
      </div>
      <div className="confidence-grid">
        <span>
          <strong>{brief.confidence.source_diversity}</strong>
          <small>{t("report.confidenceSources")}</small>
        </span>
        <span>
          <strong>{brief.confidence.freshness}</strong>
          <small>{t("report.confidenceFreshness")}</small>
        </span>
        <span>
          <strong>{brief.confidence.topic_fit}</strong>
          <small>{t("report.confidenceTopicFit")}</small>
        </span>
      </div>
      <div className="evidence-list">
        {brief.articles.slice(0, 3).map((article) => (
          <div className="evidence-row" key={article.id}>
            <span>{article.source}</span>
            <span className="evidence-meter" aria-hidden="true">
              <span style={{ width: `${Math.round(article.total_score * 100)}%` }} />
            </span>
            <strong>{Math.round(article.total_score * 10)}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;

  return (
    <section className="report-section">
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
