from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient

from news_brief_mvp.main import create_app
from news_brief_mvp.models import ArticleCitation, ArticleRecord, BriefResponse, HandoffArtifact


class StubService:
    def __init__(self, export_path: Path):
        self.export_path_value = export_path
        self.response = BriefResponse(
            brief_id="brief-123",
            topic="AI chip export controls",
            created_at=datetime(2026, 4, 17, 12, 0, tzinfo=timezone.utc),
            mode_used="fallback",
            section_generation_mode="precomputed",
            articles=[
                ArticleRecord(
                    id="fallback-1",
                    title="US expands export controls on advanced AI chips",
                    source="Reuters",
                    url="https://www.reuters.com/world/us/fallback-1",
                    published_at=datetime(2026, 4, 16, 18, 0, tzinfo=timezone.utc),
                    snippet="US officials outlined tighter controls on advanced semiconductors.",
                    source_weight=0.98,
                    freshness_score=0.90,
                    match_score=0.88,
                    total_score=0.92,
                    summary="Reuters frames the story as a policy update with immediate supply-chain implications.",
                )
            ],
            overview="Fallback overview",
            key_takeaways=["Takeaway one", "Takeaway two", "Takeaway three"],
            framing_comparison="Fallback comparison",
            uncertainties=["Uncertainty one"],
            citations=[
                ArticleCitation(
                    article_id="fallback-1",
                    title="US expands export controls on advanced AI chips",
                    source="Reuters",
                    url="https://www.reuters.com/world/us/fallback-1",
                    published_at=datetime(2026, 4, 16, 18, 0, tzinfo=timezone.utc),
                )
            ],
            export_html_path=str(export_path),
            warnings=["fallback_used"],
        )
        self.handoff = HandoffArtifact(
            brief_id="brief-123",
            topic="AI chip export controls",
            created_at=datetime(2026, 4, 17, 12, 0, tzinfo=timezone.utc),
            mode_used="fallback",
            section_generation_mode="precomputed",
            selected_source_ids=["fallback-1"],
            sections={
                "overview": "Fallback overview",
                "key_takeaways": ["Takeaway one", "Takeaway two", "Takeaway three"],
                "framing_comparison": "Fallback comparison",
                "uncertainties": ["Uncertainty one"],
            },
            warnings=["fallback_used"],
        )

    def generate_brief(self, request_model):
        return self.response

    def load_brief_response(self, brief_id: str):
        return self.response

    def get_export_path(self, brief_id: str):
        return self.export_path_value

    def load_handoff(self, brief_id: str):
        return self.handoff

    def list_recent_briefs(self):
        return [self.response]


def test_post_api_briefs_returns_json_contract(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    client = TestClient(create_app(service=StubService(export_path), artifact_root=tmp_path))

    response = client.post(
        "/api/briefs",
        json={
            "topic": "AI chip export controls",
            "mode": "fallback",
            "persona": "research_analyst",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["brief_id"] == "brief-123"
    assert payload["mode_used"] == "fallback"
    assert payload["section_generation_mode"] == "precomputed"
    assert payload["export_html_path"].endswith("brief.html")


def test_export_and_handoff_routes_surface_saved_artifacts(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    client = TestClient(create_app(service=StubService(export_path), artifact_root=tmp_path))

    export_response = client.get("/briefs/brief-123/export")
    handoff_response = client.get("/briefs/brief-123/handoff")

    health_response = client.get("/health")

    assert export_response.status_code == 200
    assert "Brief" in export_response.text
    assert handoff_response.status_code == 200
    assert handoff_response.json()["warnings"] == ["fallback_used"]
    assert handoff_response.json()["section_generation_mode"] == "precomputed"
    assert health_response.status_code == 200
    assert health_response.json()["status"] == "ok"


def test_recent_briefings_render_inspect_actions(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    client = TestClient(create_app(service=StubService(export_path), artifact_root=tmp_path))

    response = client.get("/")

    assert response.status_code == 200
    assert 'hx-get="/briefs/brief-123"' in response.text
    assert ">Inspect<" in response.text
    assert '/briefs/brief-123/handoff' in response.text


def test_show_brief_returns_partial_for_htmx_inspection(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    client = TestClient(create_app(service=StubService(export_path), artifact_root=tmp_path))

    response = client.get("/briefs/brief-123", headers={"HX-Request": "true"})

    assert response.status_code == 200
    assert "Fallback overview" in response.text
    assert "Recent Briefings" not in response.text
