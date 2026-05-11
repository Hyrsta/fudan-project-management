import { Database, FileText, GitCompareArrows, Link, Radar } from "lucide-react";

export function EmptyState() {
  return (
    <article className="empty-state">
      <div className="empty-copy-block">
        <div className="report-kicker">
          <span className="badge success">Ready</span>
          <span className="badge neutral">
            <Database size={15} />
            Source aware
          </span>
        </div>
        <h2>Ready for a briefing</h2>
        <p>Enter a topic, choose a lens, and generate a source-ranked report.</p>
        <div className="capability-row" aria-label="Report capabilities">
          <span>
            <Link size={15} />
            Evidence
          </span>
          <span>
            <GitCompareArrows size={15} />
            Comparison
          </span>
          <span>
            <Radar size={15} />
            Watch
          </span>
          <span>
            <FileText size={15} />
            Exports
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
