import json
from datetime import datetime, timedelta, timezone

import pytest

from news_brief_mvp.models import (
    ArticleRecord,
    BriefRequest,
    BriefSections,
    FallbackDataset,
)
from news_brief_mvp.service import BriefService, LiveRunFailed
from news_brief_mvp.storage import ArtifactStore


class FakeLiveRetriever:
    def __init__(self, articles):
        self.articles = articles

    def fetch(self, topic: str, limit: int, timeout_seconds: float):
        return list(self.articles)[:limit]


class FailingLLM:
    def generate_sections(self, topic: str, persona: str, articles):
        raise RuntimeError("LLM unavailable")


class WorkingLLM:
    def generate_sections(self, topic: str, persona: str, articles):
        return BriefSections(
            overview=f"Overview for {topic}",
            key_takeaways=[
                "Policy direction is still evolving.",
                "Wire services emphasize policy impact.",
                "Analysts should track implementation timing.",
            ],
            framing_comparison="Reuters focuses on policy mechanics while AP emphasizes market reaction.",
            uncertainties=[
                "Rules may change before implementation.",
                "Cross-border effects remain uncertain.",
            ],
        )


def build_article(article_id: str, title: str, source: str, hours_old: int) -> ArticleRecord:
    now = datetime(2026, 4, 17, 12, 0, tzinfo=timezone.utc)
    return ArticleRecord(
        id=article_id,
        title=title,
        source=source,
        url=f"https://example.com/{article_id}",
        published_at=now - timedelta(hours=hours_old),
        snippet=f"{title} summary snippet",
        source_weight=0.8,
    )


def make_fallback_dataset() -> FallbackDataset:
    articles = [
        ArticleRecord(
            id="fallback-1",
            title="US expands export controls on advanced AI chips",
            source="Reuters",
            url="https://www.reuters.com/world/us/fallback-1",
            published_at=datetime(2026, 4, 16, 18, 0, tzinfo=timezone.utc),
            snippet="US officials outlined tighter controls on advanced semiconductors.",
            summary="Reuters frames the story as a policy update with immediate supply-chain implications.",
            source_weight=0.98,
        ),
        ArticleRecord(
            id="fallback-2",
            title="Chipmakers assess impact of new AI export rules",
            source="AP",
            url="https://apnews.com/article/fallback-2",
            published_at=datetime(2026, 4, 16, 15, 0, tzinfo=timezone.utc),
            snippet="Major chipmakers are reviewing how the new controls affect overseas sales.",
            summary="AP highlights market reaction and the uncertainty facing manufacturers.",
            source_weight=0.95,
        ),
        ArticleRecord(
            id="fallback-3",
            title="How allies are responding to AI chip export restrictions",
            source="BBC",
            url="https://www.bbc.com/news/fallback-3",
            published_at=datetime(2026, 4, 16, 11, 0, tzinfo=timezone.utc),
            snippet="Allied governments are balancing security concerns with trade interests.",
            summary="BBC stresses the diplomatic angle and differing regional priorities.",
            source_weight=0.93,
        ),
        ArticleRecord(
            id="fallback-4",
            title="Investors watch semiconductor stocks after AI policy shift",
            source="Financial Times",
            url="https://www.ft.com/content/fallback-4",
            published_at=datetime(2026, 4, 15, 20, 0, tzinfo=timezone.utc),
            snippet="Investors are pricing in new demand and compliance costs for chipmakers.",
            summary="The FT focuses on investor sentiment and near-term market implications.",
            source_weight=0.92,
        ),
    ]
    return FallbackDataset(
        dataset_topic="AI chip export controls",
        articles=articles,
        precomputed_sections=BriefSections(
            overview="The curated demo dataset shows that export controls are tightening around advanced AI chips, with policy, market, and diplomatic implications moving in parallel.",
            key_takeaways=[
                "Policy tightening is the dominant theme across all selected sources.",
                "Wire services focus on rules and immediate market reaction.",
                "Regional outlets add more context about allied responses.",
            ],
            framing_comparison="Reuters and AP emphasize regulatory mechanics and market consequences, while BBC and FT widen the lens to diplomacy and investor positioning.",
            uncertainties=[
                "Implementation timelines remain fluid.",
                "The full commercial impact will depend on enforcement details.",
            ],
        ),
    )


def test_generate_brief_auto_falls_back_and_uses_precomputed_sections_on_llm_failure(tmp_path) -> None:
    store = ArtifactStore(tmp_path / "artifacts")
    service = BriefService(
        live_retriever=FakeLiveRetriever(
            [
                build_article("one", "Minor update on chips", "Reuters", 3),
                build_article("two", "Another partial update", "AP", 4),
            ]
        ),
        llm_client=FailingLLM(),
        artifact_store=store,
        fallback_dataset=make_fallback_dataset(),
        minimum_live_articles=4,
    )

    response = service.generate_brief(
        BriefRequest(topic="AI chip export controls", mode="auto", persona="research_analyst")
    )

    assert response.mode_used == "fallback"
    assert "fallback_used" in response.warnings
    assert response.overview.startswith("The curated demo dataset")
    assert len(response.articles) == 4
    assert store.export_path(response.brief_id).exists()

    handoff_payload = json.loads(store.handoff_path(response.brief_id).read_text())
    assert handoff_payload["mode_used"] == "fallback"
    assert "fallback_used" in handoff_payload["warnings"]
    assert handoff_payload["sections"]["overview"] == response.overview


def test_generate_brief_live_mode_raises_retryable_error_when_llm_fails(tmp_path) -> None:
    store = ArtifactStore(tmp_path / "artifacts")
    service = BriefService(
        live_retriever=FakeLiveRetriever(
            [
                build_article("one", "US weighs AI chip export controls", "Reuters", 2),
                build_article("two", "Chipmakers assess export controls", "AP", 3),
                build_article("three", "Allies react to AI chip rules", "BBC", 4),
                build_article("four", "Investors parse new chip rules", "Financial Times", 5),
            ]
        ),
        llm_client=FailingLLM(),
        artifact_store=store,
        fallback_dataset=make_fallback_dataset(),
        minimum_live_articles=4,
    )

    with pytest.raises(LiveRunFailed):
        service.generate_brief(
            BriefRequest(topic="AI chip export controls", mode="live", persona="research_analyst")
        )


def test_generate_brief_live_mode_returns_ranked_articles_and_sections(tmp_path) -> None:
    store = ArtifactStore(tmp_path / "artifacts")
    service = BriefService(
        live_retriever=FakeLiveRetriever(
            [
                build_article("one", "US weighs AI chip export controls", "Reuters", 2),
                build_article("two", "Chipmakers assess export controls", "AP", 3),
                build_article("three", "Allies react to AI chip rules", "BBC", 4),
                build_article("four", "Investors parse new chip rules", "Financial Times", 5),
            ]
        ),
        llm_client=WorkingLLM(),
        artifact_store=store,
        fallback_dataset=make_fallback_dataset(),
        minimum_live_articles=4,
    )

    response = service.generate_brief(
        BriefRequest(topic="AI chip export controls", mode="live", persona="research_analyst")
    )

    assert response.mode_used == "live"
    assert response.articles[0].total_score >= response.articles[-1].total_score
    assert response.key_takeaways[0] == "Policy direction is still evolving."
    assert response.citations[0].article_id == response.articles[0].id
