from __future__ import annotations

import html
import json
from pathlib import Path

from .models import BriefResponse, HandoffArtifact


class ArtifactStore:
    def __init__(self, root: Path):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def brief_dir(self, brief_id: str) -> Path:
        path = self.root / brief_id
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
      body {{ font-family: Georgia, serif; max-width: 960px; margin: 2rem auto; line-height: 1.6; color: #1f2937; }}
      h1, h2 {{ color: #111827; }}
      .meta {{ color: #4b5563; margin-bottom: 1.5rem; }}
      .callout {{ background: #f3f4f6; padding: 1rem; border-radius: 12px; }}
      ul {{ padding-left: 1.2rem; }}
    </style>
  </head>
  <body>
    <h1>{html.escape(response.topic)}</h1>
    <p class="meta">Lens: {html.escape(response.persona_label)} | Coverage: {html.escape(coverage_label)} | Analysis: {html.escape(section_label)} | Report ID: {html.escape(response.brief_id)}</p>
    <div class="callout">
      <strong>{html.escape(titles.get("summary", "Executive summary"))}</strong>
      <p>{html.escape(response.overview)}</p>
      {goal_html}
    </div>
    <h2>Confidence</h2>
    <p>{response.confidence.score}/100 - {html.escape(response.confidence.level)} confidence. Source diversity: {html.escape(response.confidence.source_diversity)}. Freshness: {html.escape(response.confidence.freshness)}. Topic fit: {html.escape(response.confidence.topic_fit)}.</p>
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
    <ol>{"".join(article_items)}</ol>
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
