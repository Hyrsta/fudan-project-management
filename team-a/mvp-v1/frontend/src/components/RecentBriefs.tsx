import { Clock3, FolderOpen } from "lucide-react";
import type { BriefResponse } from "../types";

type RecentBriefsProps = {
  briefs: BriefResponse[];
  onOpenBrief: (briefId: string) => void;
};

export function RecentBriefs({ briefs, onOpenBrief }: RecentBriefsProps) {
  return (
    <aside className="recent-panel" aria-label="Recent reports">
      <div className="section-head compact">
        <h2>Recent briefs</h2>
        <span className="badge neutral">{briefs.length}</span>
      </div>
      <div className="recent-stack">
        {briefs.length ? (
          briefs.slice(0, 8).map((item) => (
            <button className="recent-card" type="button" key={item.brief_id} onClick={() => onOpenBrief(item.brief_id)}>
              <span className="recent-icon">
                <FolderOpen size={15} />
              </span>
              <span className="recent-copy">
                <strong>{item.topic}</strong>
                <small>
                  <Clock3 size={13} />
                  {item.persona_label}
                </small>
              </span>
            </button>
          ))
        ) : (
          <p className="helper">Generated briefs appear here.</p>
        )}
      </div>
    </aside>
  );
}
