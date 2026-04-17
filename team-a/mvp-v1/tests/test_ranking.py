from datetime import datetime, timedelta, timezone

from news_brief_mvp.models import ArticleRecord
from news_brief_mvp.ranking import deduplicate_articles, score_articles


def make_article(
    article_id: str,
    title: str,
    source: str,
    url: str,
    published_at: datetime,
    snippet: str,
    source_weight: float,
    total_score: float = 0.0,
) -> ArticleRecord:
    return ArticleRecord(
        id=article_id,
        title=title,
        source=source,
        url=url,
        published_at=published_at,
        snippet=snippet,
        source_weight=source_weight,
        total_score=total_score,
    )


def test_score_articles_prefers_trusted_recent_topic_matches() -> None:
    now = datetime(2026, 4, 17, 12, 0, tzinfo=timezone.utc)
    topic = "AI chip export controls"
    articles = [
        make_article(
            "reuters",
            "US weighs new AI chip export controls",
            "Reuters",
            "https://www.reuters.com/world/us/ai-chip-controls",
            now - timedelta(hours=4),
            "Officials are considering tighter export rules for advanced AI chips.",
            0.98,
        ),
        make_article(
            "blog",
            "Everything you need to know about sports this weekend",
            "Unknown Blog",
            "https://example.com/blog/sports-weekend",
            now - timedelta(hours=1),
            "A roundup of major sports fixtures and player injuries.",
            0.25,
        ),
    ]

    scored = score_articles(articles, topic=topic, now=now)

    assert scored[0].id == "reuters"
    assert scored[0].total_score > scored[1].total_score
    assert scored[0].match_score > scored[1].match_score


def test_deduplicate_articles_keeps_highest_scoring_entry_for_duplicate_story() -> None:
    now = datetime(2026, 4, 17, 12, 0, tzinfo=timezone.utc)
    higher = make_article(
        "ap",
        "Markets react to AI chip export controls",
        "AP",
        "https://apnews.com/article/ai-chip-controls?utm_source=newsletter",
        now - timedelta(hours=8),
        "Global markets reacted after US officials signaled possible new export limits.",
        0.95,
        total_score=0.87,
    )
    lower = make_article(
        "duplicate",
        "Markets react to AI chip export controls",
        "Aggregator",
        "https://apnews.com/article/ai-chip-controls",
        now - timedelta(hours=6),
        "A copied version of the same wire story.",
        0.30,
        total_score=0.41,
    )

    deduplicated = deduplicate_articles([lower, higher])

    assert len(deduplicated) == 1
    assert deduplicated[0].id == "ap"
