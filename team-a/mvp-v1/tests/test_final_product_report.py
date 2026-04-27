from datetime import datetime, timedelta, timezone

from news_brief_mvp.models import ArticleRecord, BriefRequest, BriefSections, FallbackDataset
from news_brief_mvp.service import BriefService
from news_brief_mvp.storage import ArtifactStore


class EmptyLiveRetriever:
    def fetch(self, topic: str, limit: int, timeout_seconds: float):
        return []


class FailingLLM:
    def generate_sections(self, topic: str, persona: str, articles, goal: str = ""):
        raise RuntimeError("no model")


def build_article(article_id: str, title: str, source: str, hours_old: int) -> ArticleRecord:
    now = datetime(2026, 4, 26, 9, 0, tzinfo=timezone.utc)
    return ArticleRecord(
        id=article_id,
        title=title,
        source=source,
        url=f"https://example.com/{article_id}",
        published_at=now - timedelta(hours=hours_old),
        snippet=f"{title} with concrete context for the report.",
        summary=f"{title} with concrete context for the report.",
        source_weight=0.9,
    )


def make_dataset() -> FallbackDataset:
    articles = [
        build_article("one", "AI chip export controls tighten", "Reuters", 2),
        build_article("two", "Chipmakers assess new export controls", "AP", 3),
        build_article("three", "Allies respond to semiconductor rules", "BBC", 4),
        build_article("four", "Investors watch chip supply chains", "Financial Times", 6),
    ]
    return FallbackDataset(
        dataset_topic="AI chip export controls",
        articles=articles,
        precomputed_sections=BriefSections(
            overview="Export controls are tightening.",
            key_takeaways=["Policy is tightening.", "Markets are watching.", "Allies are reacting."],
            framing_comparison="Reuters focuses on policy while AP focuses on companies.",
            uncertainties=["Implementation may change."],
        ),
    )


def test_final_product_fallback_report_contains_structured_sections(tmp_path) -> None:
    store = ArtifactStore(tmp_path / "artifacts")
    service = BriefService(
        live_retriever=EmptyLiveRetriever(),
        llm_client=FailingLLM(),
        artifact_store=store,
        fallback_dataset=make_dataset(),
        minimum_live_articles=4,
    )

    response = service.generate_brief(
        BriefRequest(topic="AI chip export controls", mode="auto", persona="research_analyst")
    )

    assert response.executive_summary.startswith("For the topic 'AI chip export controls'")
    assert len(response.key_facts) >= 3
    assert len(response.insights) >= 2
    assert response.risk_notes == response.uncertainties
    assert response.source_evidence[0].why_selected
    assert response.pipeline_metadata["collector"] == "fallback_dataset"
    assert response.pipeline_metadata["report"] == "heuristic"
    assert store.markdown_path(response.brief_id).exists()


def test_financial_persona_lens_shapes_report_contract(tmp_path) -> None:
    store = ArtifactStore(tmp_path / "artifacts")
    service = BriefService(
        live_retriever=EmptyLiveRetriever(),
        llm_client=FailingLLM(),
        artifact_store=store,
        fallback_dataset=make_dataset(),
        minimum_live_articles=4,
    )

    response = service.generate_brief(
        BriefRequest(
            topic="AI chip export controls",
            mode="auto",
            persona="financial_analyst",
            goal="Assess investor exposure for semiconductor companies",
        )
    )

    assert response.persona == "financial_analyst"
    assert response.persona_label == "Financial analyst"
    assert response.goal == "Assess investor exposure for semiconductor companies"
    assert response.pipeline_metadata["persona"]["label"] == "Financial analyst"
    assert response.confidence.score > 0
    assert response.confidence.level in {"High", "Medium", "Developing"}
    assert response.section_titles["insights"] == "Market signals"
    assert any("market" in item.lower() or "investor" in item.lower() for item in response.insights)

    handoff = response.to_handoff_artifact()

    assert handoff.persona == "financial_analyst"
    assert handoff.goal == response.goal
    assert handoff.confidence.score == response.confidence.score
