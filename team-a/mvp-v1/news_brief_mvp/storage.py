from __future__ import annotations

import html
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

    def export_path(self, brief_id: str) -> Path:
        return self.brief_dir(brief_id) / "brief.html"

    def save(self, response: BriefResponse, handoff: HandoffArtifact) -> None:
        self.brief_json_path(response.brief_id).write_text(
            response.model_dump_json(indent=2)
        )
        self.handoff_path(handoff.brief_id).write_text(
            handoff.model_dump_json(indent=2)
        )
        self.export_path(response.brief_id).write_text(_render_export_html(response))

    def load_brief(self, brief_id: str) -> BriefResponse:
        return BriefResponse.model_validate_json(self.brief_json_path(brief_id).read_text())

    def load_handoff(self, brief_id: str) -> HandoffArtifact:
        return HandoffArtifact.model_validate_json(self.handoff_path(brief_id).read_text())

    def list_briefs(self, limit: int = 6) -> list[BriefResponse]:
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
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>{html.escape(response.topic)} - Team A MVP Brief</title>
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
    <p class="meta">Mode used: {html.escape(response.mode_used)} | Sections: {html.escape(response.section_generation_mode)} | Brief ID: {html.escape(response.brief_id)}</p>
    <div class="callout">
      <strong>Overview</strong>
      <p>{html.escape(response.overview)}</p>
    </div>
    <h2>Key takeaways</h2>
    <ul>{takeaway_items}</ul>
    <h2>Source framing comparison</h2>
    <p>{html.escape(response.framing_comparison)}</p>
    <h2>Uncertainties and limits</h2>
    <ul>{uncertainty_items}</ul>
    <h2>Selected sources</h2>
    <ol>{"".join(article_items)}</ol>
  </body>
</html>
"""

