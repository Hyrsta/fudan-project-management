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
import type { BriefResponse } from "../types";

type BriefReportProps = {
  brief: BriefResponse;
};

export function BriefReport({ brief }: BriefReportProps) {
  const titles = brief.section_titles || {};
  const riskItems = brief.risk_notes.length ? brief.risk_notes : brief.uncertainties;

  return (
    <article className="report-card">
      <header className="report-head">
        <div className="report-title-block">
          <div className="report-kicker">
            <span className="badge success">Ready</span>
            {brief.warnings.includes("fallback_used") && <span className="badge warning">Saved coverage</span>}
          </div>
          <h2 className="report-topic">{brief.topic}</h2>
          <div className="report-meta">
            <span className="meta-pill">
              <UserRoundCheck size={15} />
              {brief.persona_label}
            </span>
            <span className="meta-pill">
              <LinkIcon size={15} />
              {brief.articles.length} sources
            </span>
            <span className="meta-pill">
              <RadioTower size={15} />
              {brief.mode_used === "live" ? "Live coverage" : "Saved coverage"}
            </span>
            <span className="meta-pill">
              <Clock3 size={15} />
              {new Date(brief.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        <nav className="report-actions" aria-label="Report actions">
          <a className="text-link-button" href={`/briefs/${brief.brief_id}/export`}>
            <FileCode size={16} />
            HTML
          </a>
          <a className="text-link-button" href={`/briefs/${brief.brief_id}/export.md`}>
            <Download size={16} />
            Markdown
          </a>
          <a className="text-link-button" href={`/briefs/${brief.brief_id}/handoff`}>
            <Braces size={16} />
            Handoff
          </a>
        </nav>
      </header>

      <section className="summary-row">
        <div className="summary-block">
          <h3 className="section-title">{titles.summary || "Executive summary"}</h3>
          <p>{brief.executive_summary || brief.overview}</p>
          {brief.goal && (
            <p className="goal-note">
              <Target size={16} />
              {brief.goal}
            </p>
          )}
        </div>
        <EvidencePanel brief={brief} />
      </section>

      <section className="insight-grid">
        <ReportList title={titles.takeaways || "Takeaways"} items={brief.key_takeaways} />
        <ReportList title={titles.facts || "Key facts"} items={brief.key_facts} />
        <ReportList title={titles.insights || "Signals"} items={brief.insights} />
        <ReportList title={titles.watch || "Watch"} items={riskItems} />
      </section>

      <section className="report-section comparison-note">
        <h3>
          <GitCompareArrows size={16} />
          {titles.note || "Coverage note"}
        </h3>
        <p>{brief.framing_comparison}</p>
      </section>

      <section className="source-list" aria-label="Selected sources list">
        <div className="section-head compact">
          <h3>Source evidence</h3>
          <span className="source-count">{brief.articles.length} selected</span>
        </div>
        {brief.articles.map((article, index) => (
          <article className="source-row" key={article.id}>
            <div className="source-index">{String(index + 1).padStart(2, "0")}</div>
            <div className="source-main">
              <h4>{article.title}</h4>
              <p className="source-meta">{article.source}</p>
              <p className="source-snippet">{article.summary || article.snippet}</p>
              <div className="score-row">
                <span className="score-pill">Rank {article.total_score.toFixed(2)}</span>
                <span className="score-pill">Fresh {article.freshness_score.toFixed(2)}</span>
                <span className="score-pill">Fit {article.match_score.toFixed(2)}</span>
              </div>
            </div>
            <a className="text-link-button" href={article.url} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              Source
            </a>
          </article>
        ))}
      </section>
    </article>
  );
}

function EvidencePanel({ brief }: { brief: BriefResponse }) {
  return (
    <aside className="evidence-panel">
      <div className="evidence-topline">
        <h3>
          <Database size={18} />
          Evidence
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
          <small>Sources</small>
        </span>
        <span>
          <strong>{brief.confidence.freshness}</strong>
          <small>Freshness</small>
        </span>
        <span>
          <strong>{brief.confidence.topic_fit}</strong>
          <small>Topic fit</small>
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
