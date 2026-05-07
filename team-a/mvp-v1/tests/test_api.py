from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient

from news_brief_mvp.auth import RBACSettings
from news_brief_mvp.main import create_app
from news_brief_mvp.models import ArticleCitation, ArticleRecord, BriefResponse, HandoffArtifact


VIEWER_HEADERS = {"X-API-Key": "viewer-local-token"}
ANALYST_HEADERS = {"X-API-Key": "analyst-local-token"}
ADMIN_HEADERS = {"X-API-Key": "admin-local-token"}


class StubService:
    def __init__(self, export_path: Path, markdown_path: Path = None):
        self.export_path_value = export_path
        self.markdown_path_value = markdown_path or export_path.with_suffix(".md")
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
            markdown_export_path=str(self.markdown_path_value),
            warnings=["fallback_used"],
        )
        self.handoff = self.response.to_handoff_artifact()
        self.last_request = None

    def generate_brief(self, request_model):
        self.last_request = request_model
        return self.response

    def load_brief_response(self, brief_id: str):
        return self.response

    def get_export_path(self, brief_id: str):
        return self.export_path_value

    def get_markdown_path(self, brief_id: str):
        return self.markdown_path_value

    def load_handoff(self, brief_id: str):
        return self.handoff

    def list_recent_briefs(self):
        return [self.response]


def test_post_api_briefs_returns_json_contract(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    service = StubService(export_path)
    client = TestClient(create_app(service=service, artifact_root=tmp_path))

    response = client.post(
        "/api/briefs",
        headers=ANALYST_HEADERS,
        json={
            "topic": "AI chip export controls",
            "mode": "fallback",
            "persona": "financial_analyst",
            "goal": "Assess investor exposure",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["brief_id"] == "brief-123"
    assert payload["mode_used"] == "fallback"
    assert payload["section_generation_mode"] == "precomputed"
    assert payload["export_html_path"].endswith("brief.html")
    assert service.last_request.persona == "financial_analyst"
    assert service.last_request.goal == "Assess investor exposure"


def test_rbac_rejects_missing_api_key_for_protected_routes(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    service = StubService(export_path)
    client = TestClient(create_app(service=service, artifact_root=tmp_path))

    create_response = client.post(
        "/api/briefs",
        json={"topic": "AI chip export controls", "mode": "fallback"},
    )
    export_response = client.get("/briefs/brief-123/export")

    assert create_response.status_code == 401
    assert export_response.status_code == 401
    assert service.last_request is None


def test_rbac_rejects_viewer_create_and_allows_analyst_create(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    service = StubService(export_path)
    client = TestClient(create_app(service=service, artifact_root=tmp_path))

    viewer_response = client.post(
        "/api/briefs",
        headers=VIEWER_HEADERS,
        json={"topic": "AI chip export controls", "mode": "fallback"},
    )
    analyst_response = client.post(
        "/api/briefs",
        headers=ANALYST_HEADERS,
        json={"topic": "AI chip export controls", "mode": "fallback"},
    )

    assert viewer_response.status_code == 403
    assert analyst_response.status_code == 200
    assert service.last_request.topic == "AI chip export controls"


def test_rbac_accepts_cookie_for_browser_downloads(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    client = TestClient(create_app(service=StubService(export_path), artifact_root=tmp_path))

    client.cookies.set("news_brief_api_key", "viewer-local-token")
    viewer_export = client.get("/briefs/brief-123/export")
    viewer_handoff = client.get("/briefs/brief-123/handoff")
    client.cookies.set("news_brief_api_key", "admin-local-token")
    admin_handoff = client.get("/briefs/brief-123/handoff")

    assert viewer_export.status_code == 200
    assert viewer_handoff.status_code == 403
    assert admin_handoff.status_code == 200


def test_rbac_can_be_configured_with_custom_role_tokens(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    settings = RBACSettings(enabled=True, token_roles={"reader-key": "viewer", "writer-key": "analyst"})
    client = TestClient(create_app(service=StubService(export_path), artifact_root=tmp_path, rbac_settings=settings))

    viewer_response = client.get("/briefs/brief-123/export", headers={"X-API-Key": "reader-key"})
    analyst_response = client.post(
        "/api/briefs",
        headers={"X-API-Key": "writer-key"},
        json={"topic": "AI chip export controls", "mode": "fallback"},
    )

    assert viewer_response.status_code == 200
    assert analyst_response.status_code == 200


def test_export_and_handoff_routes_surface_saved_artifacts(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    markdown_path = tmp_path / "brief.md"
    export_path.write_text("<html><body>Brief</body></html>")
    markdown_path.write_text("# Brief\n\nMarkdown export")
    client = TestClient(create_app(service=StubService(export_path, markdown_path), artifact_root=tmp_path))

    export_response = client.get("/briefs/brief-123/export", headers=VIEWER_HEADERS)
    markdown_response = client.get("/briefs/brief-123/export.md", headers=VIEWER_HEADERS)
    handoff_response = client.get("/briefs/brief-123/handoff", headers=ADMIN_HEADERS)

    health_response = client.get("/health")

    assert export_response.status_code == 200
    assert "Brief" in export_response.text
    assert markdown_response.status_code == 200
    assert "Markdown export" in markdown_response.text
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
    assert 'name="mode"' in response.text
    assert 'name="persona"' in response.text
    assert 'name="goal"' in response.text
    assert 'data-action="select-persona"' in response.text
    assert 'id="access-role"' in response.text
    assert 'data-action="apply-access"' in response.text
    assert "/static/css/app.css" in response.text
    assert "/static/js/app.js" in response.text
    assert "NEWS_BRIEF_RBAC_CONFIG" in response.text
    assert "Financial analyst" in response.text
    assert "Balanced coverage" in response.text


def test_show_brief_returns_partial_for_htmx_inspection(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    client = TestClient(create_app(service=StubService(export_path), artifact_root=tmp_path))

    response = client.get("/briefs/brief-123", headers={**VIEWER_HEADERS, "HX-Request": "true"})

    assert response.status_code == 200
    assert "Fallback overview" in response.text
    assert "Recent Briefings" not in response.text


def test_report_controls_have_action_handlers(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    client = TestClient(create_app(service=StubService(export_path), artifact_root=tmp_path))

    full_response = client.get("/briefs/brief-123", headers=VIEWER_HEADERS)
    partial_response = client.get("/briefs/brief-123", headers={**VIEWER_HEADERS, "HX-Request": "true"})

    assert full_response.status_code == 200
    assert partial_response.status_code == 200
    assert 'id="toast-region"' in full_response.text
    assert "/static/js/app.js" in full_response.text
    assert 'data-action="copy-link"' in partial_response.text
    assert 'data-action="save-report"' in partial_response.text
    assert 'data-action="toggle-more-menu"' in partial_response.text
    assert 'data-action="toggle-section"' in partial_response.text


def test_static_frontend_assets_are_served(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    client = TestClient(create_app(service=StubService(export_path), artifact_root=tmp_path))

    script_response = client.get("/static/js/app.js")
    style_response = client.get("/static/css/app.css")

    assert script_response.status_code == 200
    assert "function handleActionClick" in script_response.text
    assert "NEWS_BRIEF_RBAC_CONFIG" in script_response.text
    assert style_response.status_code == 200
    assert ".app-frame" in style_response.text


def test_workspace_navigation_controls_are_wired(tmp_path) -> None:
    export_path = tmp_path / "brief.html"
    export_path.write_text("<html><body>Brief</body></html>")
    client = TestClient(create_app(service=StubService(export_path), artifact_root=tmp_path))

    response = client.get("/briefs/brief-123", headers=VIEWER_HEADERS)

    assert response.status_code == 200
    for action in [
        "focus-search",
        "scroll-report",
        "open-coverage",
        "open-sources",
        "open-recent",
        "scroll-alerts",
        "open-settings",
        "open-help",
        "show-profile",
        "apply-settings",
    ]:
        assert f'data-action="{action}"' in response.text
    assert 'id="settings-panel"' in response.text
    assert 'id="help-panel"' in response.text
    assert 'id="profile-panel"' in response.text
    assert 'id="trusted-sources-panel"' in response.text
    assert 'href="#result-panel"' not in response.text
