from __future__ import annotations

import html
import json
import shutil
from pathlib import Path

from .models import BriefResponse, HandoffArtifact


class ArtifactStore:
    def __init__(self, root: Path):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def brief_dir(self, brief_id: str) -> Path:
        path = self._brief_dir_path(brief_id)
        path.mkdir(parents=True, exist_ok=True)
        return path

    def brief_json_path(self, brief_id: str) -> Path:
        return self.brief_dir(brief_id) / "brief.json"

    def handoff_path(self, brief_id: str) -> Path:
        return self.brief_dir(brief_id) / "handoff.json"

    def manifest_path(self) -> Path:
        return self.root / "manifest.json"

    def export_path(self, brief_id: str) -> Path:
        return self.brief_dir(brief_id) / "brief.html"

    def markdown_path(self, brief_id: str) -> Path:
        return self.brief_dir(brief_id) / "brief.md"

    def save(self, response: BriefResponse, handoff: HandoffArtifact) -> None:
        if not response.export_html_path:
            response.export_html_path = str(self.export_path(response.brief_id))
        if not response.markdown_export_path:
            response.markdown_export_path = str(self.markdown_path(response.brief_id))
        self.brief_json_path(response.brief_id).write_text(
            response.model_dump_json(indent=2)
        )
        self.handoff_path(handoff.brief_id).write_text(
            handoff.model_dump_json(indent=2)
        )
        self.export_path(response.brief_id).write_text(_render_export_html(response))
        self.markdown_path(response.brief_id).write_text(_render_export_markdown(response))
        self._update_manifest(response)

    def load_brief(self, brief_id: str) -> BriefResponse:
        return BriefResponse.model_validate_json(self.brief_json_path(brief_id).read_text())

    def load_handoff(self, brief_id: str) -> HandoffArtifact:
        return HandoffArtifact.model_validate_json(self.handoff_path(brief_id).read_text())

    def delete_brief(self, brief_id: str) -> None:
        path = self._brief_dir_path(brief_id)
        if not path.is_dir():
            raise FileNotFoundError(brief_id)
        shutil.rmtree(path)
        self._remove_from_manifest(brief_id)

    def list_briefs(self, limit: int = 6) -> list[BriefResponse]:
        manifest_briefs = self._list_from_manifest(limit=limit)
        if manifest_briefs:
            return manifest_briefs

        briefs = []
        if not self.root.exists():
            return briefs
        for child in sorted(self.root.iterdir(), key=lambda item: item.stat().st_mtime, reverse=True):
            if not child.is_dir():
                continue
            brief_path = child / "brief.json"
            if not brief_path.exists():
                continue
            try:
                briefs.append(BriefResponse.model_validate_json(brief_path.read_text()))
            except Exception:
                continue
            if len(briefs) >= limit:
                break
        return briefs

    def _list_from_manifest(self, limit: int) -> list[BriefResponse]:
        manifest = self._read_manifest()
        briefs = []
        for entry in manifest.get("briefs", []):
            brief_id = entry.get("brief_id")
            if not brief_id:
                continue
            try:
                briefs.append(self.load_brief(brief_id))
            except Exception:
                continue
            if len(briefs) >= limit:
                break
        return briefs

    def _read_manifest(self):
        path = self.manifest_path()
        if not path.exists():
            return {"briefs": []}
        try:
            payload = json.loads(path.read_text())
        except Exception:
            return {"briefs": []}
        if not isinstance(payload, dict) or not isinstance(payload.get("briefs"), list):
            return {"briefs": []}
        return payload

    def _update_manifest(self, response: BriefResponse) -> None:
        manifest = self._read_manifest()
        entry = {
            "brief_id": response.brief_id,
            "topic": response.topic,
            "created_at": response.created_at.isoformat(),
            "mode_used": response.mode_used,
            "section_generation_mode": response.section_generation_mode,
            "persona": response.persona,
            "persona_label": response.persona_label,
            "goal": response.goal,
            "source_count": len(response.articles),
            "confidence_score": response.confidence.score,
            "confidence_level": response.confidence.level,
            "warnings": response.warnings,
            "export_html_path": str(self.export_path(response.brief_id)),
            "markdown_export_path": str(self.markdown_path(response.brief_id)),
        }
        existing = [
            item for item in manifest.get("briefs", [])
            if item.get("brief_id") != response.brief_id
        ]
        manifest["briefs"] = [entry] + existing
        self.manifest_path().write_text(json.dumps(manifest, indent=2))

    def _remove_from_manifest(self, brief_id: str) -> None:
        manifest = self._read_manifest()
        manifest["briefs"] = [
            item for item in manifest.get("briefs", [])
            if item.get("brief_id") != brief_id
        ]
        self.manifest_path().write_text(json.dumps(manifest, indent=2))

    def _brief_dir_path(self, brief_id: str) -> Path:
        if not brief_id or Path(brief_id).name != brief_id:
            raise FileNotFoundError(brief_id)
        root = self.root.resolve()
        path = (self.root / brief_id).resolve()
        if path == root or root not in path.parents:
            raise FileNotFoundError(brief_id)
        return path


def _render_export_html(response: BriefResponse) -> str:
    article_items = []
    for article in response.articles:
        article_items.append(
            (
                f"<li><strong>{html.escape(article.title)}</strong> "
                f"({html.escape(article.source)})<br>"
                f"<span>{html.escape(article.summary or article.snippet)}</span><br>"
                f"<a href=\"{html.escape(article.url)}\">Source link</a></li>"
            )
        )

    takeaway_items = "".join(
        f"<li>{html.escape(item)}</li>" for item in response.key_takeaways
    )
    uncertainty_items = "".join(
        f"<li>{html.escape(item)}</li>" for item in response.uncertainties
    )
    fact_items = "".join(
        f"<li>{html.escape(item)}</li>" for item in response.key_facts
    )
    insight_items = "".join(
        f"<li>{html.escape(item)}</li>" for item in response.insights
    )
    evidence_items = "".join(
        (
            f"<li><strong>{html.escape(item.source)}</strong>: "
            f"{html.escape(item.why_selected)} "
            f"<a href=\"{html.escape(item.url)}\">Evidence</a></li>"
        )
        for item in response.source_evidence
    )
    coverage_label = "Live coverage" if response.mode_used == "live" else "Saved source coverage"
    section_label = "AI assisted" if response.section_generation_mode == "llm" else "Local analysis"
    titles = response.section_titles
    goal_html = (
        f"<p><strong>Research goal:</strong> {html.escape(response.goal)}</p>"
        if response.goal
        else ""
    )
    confidence_items = "".join(
        f"<li>{html.escape(item)}</li>" for item in response.confidence.rationale
    )
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>{html.escape(response.topic)} - News Intelligence Report</title>
    <style>
      :root {{
        --paper: #f4efe4;
        --surface: #fffaf0;
        --surface-strong: #ffffff;
        --ink: #18201c;
        --ink-soft: #344139;
        --muted: #6d746c;
        --border: #d8cebb;
        --signal-green: #116149;
        --signal-green-soft: #dceee2;
        --vermilion: #c1452c;
        --vermilion-soft: #f8ded6;
        --link-blue: #2f6683;
        --radius: 8px;
        --font-body: Aptos, Candara, "Trebuchet MS", sans-serif;
        --font-display: Bahnschrift, "Aptos Display", "Trebuchet MS", sans-serif;
      }}
      * {{ box-sizing: border-box; }}
      body.command-center-export {{
        max-width: 1020px;
        margin: 0 auto;
        padding: 2rem;
        background:
          linear-gradient(90deg, rgba(17, 97, 73, 0.08) 1px, transparent 1px),
          linear-gradient(180deg, rgba(17, 97, 73, 0.06) 1px, transparent 1px),
          var(--paper);
        background-size: 40px 40px, 40px 40px, auto;
        color: var(--ink);
        font-family: var(--font-body);
        line-height: 1.6;
      }}
      h1, h2, .meta, .callout strong {{
        font-family: var(--font-display);
      }}
      h1 {{
        margin: 0 0 0.75rem;
        font-size: clamp(2rem, 5vw, 3.5rem);
        line-height: 0.98;
      }}
      h2 {{
        margin: 1.6rem 0 0.6rem;
        color: var(--ink);
        font-size: 1.05rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }}
      a {{ color: var(--link-blue); font-weight: 700; }}
      .meta {{
        color: var(--muted);
        margin-bottom: 1.5rem;
      }}
      .callout {{
        border: 1px solid var(--border);
        border-left: 4px solid var(--signal-green);
        border-radius: var(--radius);
        background: rgba(255, 250, 240, 0.94);
        box-shadow: 0 18px 42px rgba(42, 35, 24, 0.12);
        padding: 1rem 1.1rem;
      }}
      .confidence-strip {{
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.6rem;
        margin: 0.8rem 0;
      }}
      .confidence-strip span {{
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--surface-strong);
        padding: 0.65rem;
      }}
      ol, ul {{ padding-left: 1.2rem; }}
      li {{ margin: 0.45rem 0; }}
      li strong {{ color: var(--ink); }}
      .source-list li {{
        border-bottom: 1px solid var(--border);
        padding-bottom: 0.7rem;
      }}
      .source-list li:last-child {{ border-bottom: 0; }}
      @media (max-width: 720px) {{
        body.command-center-export {{ padding: 1rem; }}
        .confidence-strip {{ grid-template-columns: 1fr; }}
      }}
    </style>
  </head>
  <body class="command-center-export">
    <h1>{html.escape(response.topic)}</h1>
    <p class="meta">Lens: {html.escape(response.persona_label)} | Coverage: {html.escape(coverage_label)} | Analysis: {html.escape(section_label)} | Report ID: {html.escape(response.brief_id)}</p>
    <div class="callout">
      <strong>{html.escape(titles.get("summary", "Executive summary"))}</strong>
      <p>{html.escape(response.overview)}</p>
      {goal_html}
    </div>
    <h2>Confidence</h2>
    <p>{response.confidence.score}/100 - {html.escape(response.confidence.level)} confidence.</p>
    <div class="confidence-strip">
      <span><strong>{html.escape(response.confidence.source_diversity)}</strong><br>Sources</span>
      <span><strong>{html.escape(response.confidence.freshness)}</strong><br>Freshness</span>
      <span><strong>{html.escape(response.confidence.topic_fit)}</strong><br>Topic fit</span>
    </div>
    <ul>{confidence_items}</ul>
    <h2>{html.escape(titles.get("takeaways", "Key takeaways"))}</h2>
    <ul>{takeaway_items}</ul>
    <h2>{html.escape(titles.get("facts", "Key facts"))}</h2>
    <ul>{fact_items}</ul>
    <h2>{html.escape(titles.get("comparison", "Source framing comparison"))}</h2>
    <p>{html.escape(response.framing_comparison)}</p>
    <h2>{html.escape(titles.get("insights", "Insights and signals"))}</h2>
    <ul>{insight_items}</ul>
    <h2>{html.escape(titles.get("watch", "Uncertainties and limits"))}</h2>
    <ul>{uncertainty_items}</ul>
    <h2>Source evidence</h2>
    <ol>{evidence_items}</ol>
    <h2>Selected sources</h2>
    <ol class="source-list">{"".join(article_items)}</ol>
  </body>
</html>
"""


def _render_export_markdown(response: BriefResponse) -> str:
    coverage_label = "Live coverage" if response.mode_used == "live" else "Saved source coverage"
    section_label = "AI assisted" if response.section_generation_mode == "llm" else "Local analysis"
    titles = response.section_titles
    lines = [
        f"# {response.topic}",
        "",
        f"- Report ID: `{response.brief_id}`",
        f"- Created: {response.created_at.isoformat()}",
        f"- Lens: {response.persona_label}",
        f"- Coverage: {coverage_label}",
        f"- Analysis: {section_label}",
        f"- Sources: {len(response.articles)}",
    ]
    if response.goal:
        lines.append(f"- Research goal: {response.goal}")
    lines.extend([
        "",
        f"## {titles.get('summary', 'Executive Summary')}",
        "",
        response.executive_summary or response.overview,
        "",
        "## Confidence",
        "",
        f"{response.confidence.score}/100 - {response.confidence.level} confidence.",
        "",
        f"- Source diversity: {response.confidence.source_diversity}",
        f"- Freshness: {response.confidence.freshness}",
        f"- Topic fit: {response.confidence.topic_fit}",
    ])
    lines.extend(f"- {item}" for item in response.confidence.rationale)
    lines.extend([
        "",
        f"## {titles.get('takeaways', 'Key Takeaways')}",
        "",
    ])
    lines.extend(f"- {item}" for item in response.key_takeaways)
    lines.extend(["", f"## {titles.get('facts', 'Key Facts')}", ""])
    lines.extend(f"- {item}" for item in response.key_facts)
    lines.extend(["", f"## {titles.get('comparison', 'Coverage Comparison')}", "", response.framing_comparison, ""])
    lines.extend([f"## {titles.get('insights', 'Insights and Signals')}", ""])
    lines.extend(f"- {item}" for item in response.insights)
    lines.extend(["", f"## {titles.get('watch', 'Risk Notes and Limits')}", ""])
    lines.extend(f"- {item}" for item in (response.risk_notes or response.uncertainties))
    lines.extend(["", "## Source Evidence", ""])
    for item in response.source_evidence:
        lines.append(
            f"- [{item.source}]({item.url}) - {item.why_selected} "
            f"(credibility {item.credibility_score:.2f}, freshness {item.freshness_score:.2f}, topic fit {item.topic_fit:.2f})"
        )
    lines.extend(["", "## Selected Sources", ""])
    for article in response.articles:
        lines.append(f"- [{article.title}]({article.url}) - {article.source}")
    if response.quality_notes:
        lines.extend(["", "## Quality Notes", ""])
        lines.extend(f"- {item}" for item in response.quality_notes)
    return "\n".join(lines).rstrip() + "\n"
