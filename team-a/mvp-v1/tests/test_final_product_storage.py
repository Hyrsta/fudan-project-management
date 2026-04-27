from datetime import datetime, timezone

from news_brief_mvp.models import ArticleRecord, BriefResponse, SourceEvidence
from news_brief_mvp.storage import ArtifactStore


def make_final_product_response(export_root) -> BriefResponse:
    article = ArticleRecord(
        id="article-1",
        title="AI chip export controls tighten",
        source="Reuters",
        url="https://example.com/article-1",
        published_at=datetime(2026, 4, 26, 8, 0, tzinfo=timezone.utc),
        snippet="Officials described tighter export controls for advanced AI chips.",
        summary="Officials described tighter export controls for advanced AI chips.",
        source_weight=0.98,
        freshness_score=0.85,
        match_score=1.0,
        total_score=0.9385,
    )
    return BriefResponse(
        brief_id="brief-final",
        topic="AI chip export controls",
        created_at=datetime(2026, 4, 26, 9, 0, tzinfo=timezone.utc),
        mode_used="fallback",
        section_generation_mode="heuristic",
        articles=[article],
        overview="Executive summary for the final product report.",
        executive_summary="Executive summary for the final product report.",
        key_takeaways=["Policy tightening is the dominant theme."],
        key_facts=["Reuters reported tighter controls for advanced chips."],
        framing_comparison="Reuters focuses on policy mechanics.",
        insights=["Chip supply chains remain the key watch point."],
        uncertainties=["Implementation details may change."],
        risk_notes=["Implementation details may change."],
        citations=[],
        source_evidence=[
            SourceEvidence(
                article_id="article-1",
                title="AI chip export controls tighten",
                source="Reuters",
                url="https://example.com/article-1",
                published_at=datetime(2026, 4, 26, 8, 0, tzinfo=timezone.utc),
                credibility_score=0.98,
                freshness_score=0.85,
                topic_fit=1.0,
                why_selected="High source trust, recent coverage, and strong topic fit.",
            )
        ],
        export_html_path=str(export_root / "brief-final" / "brief.html"),
        markdown_export_path=str(export_root / "brief-final" / "brief.md"),
        pipeline_metadata={"collector": "fallback_dataset", "report": "heuristic"},
        quality_notes=["Generated with deterministic fallback sections."],
        warnings=["fallback_used"],
    )


def test_artifact_store_writes_manifest_and_markdown_export(tmp_path) -> None:
    store = ArtifactStore(tmp_path / "artifacts")
    response = make_final_product_response(store.root)

    store.save(response, handoff=response.to_handoff_artifact())

    manifest = store.manifest_path()
    markdown = store.markdown_path(response.brief_id)

    assert manifest.exists()
    assert markdown.exists()
    assert "# AI chip export controls" in markdown.read_text()
    assert "## Source Evidence" in markdown.read_text()
    assert store.list_briefs(limit=1)[0].brief_id == "brief-final"


def test_artifact_store_skips_corrupt_manifest_entries(tmp_path) -> None:
    store = ArtifactStore(tmp_path / "artifacts")
    response = make_final_product_response(store.root)
    store.save(response, handoff=response.to_handoff_artifact())
    (store.brief_dir("brief-broken") / "brief.json").write_text("{broken")

    store.manifest_path().write_text(
        '{"briefs":[{"brief_id":"brief-broken"},{"brief_id":"brief-final"}]}'
    )

    briefs = store.list_briefs(limit=3)

    assert [brief.brief_id for brief in briefs] == ["brief-final"]

