from datetime import datetime, timezone

from news_brief_mvp.data_loader import SourceFeed, SourceRegistry
from news_brief_mvp.live_retriever import GoogleNewsRSSRetriever, _clean_title, _entry_published_at, _normalize_text


def test_normalize_text_collapses_nbsp_and_extra_spaces() -> None:
    assert _normalize_text("US\xa0\xa0chip exports   tighten") == "US chip exports tighten"


def test_clean_title_removes_trailing_source_after_nonbreaking_spaces() -> None:
    raw_title = "US mulls new rules for AI chip exports, including requiring US investments by foreign firms\xa0\xa0Reuters"
    assert _clean_title(raw_title, "Reuters") == (
        "US mulls new rules for AI chip exports, including requiring US investments by foreign firms"
    )


def test_clean_title_removes_dash_source_suffix() -> None:
    assert _clean_title("US mulls new AI chip export rules - Reuters", "Reuters") == (
        "US mulls new AI chip export rules"
    )


def test_retriever_uses_direct_feeds_and_filters_weak_topic_matches(monkeypatch) -> None:
    direct_feed = """<?xml version="1.0" encoding="UTF-8"?>
    <rss><channel>
      <item>
        <title>AI chip export controls tighten for advanced semiconductors</title>
        <link>https://bbc.example/chips</link>
        <pubDate>Sun, 26 Apr 2026 08:00:00 GMT</pubDate>
        <description>Policy officials described export controls for AI chips.</description>
      </item>
      <item>
        <title>Weekend football results</title>
        <link>https://bbc.example/sports</link>
        <pubDate>Sun, 26 Apr 2026 08:05:00 GMT</pubDate>
        <description>Sports coverage unrelated to the research topic.</description>
      </item>
    </channel></rss>
    """
    google_feed = """<?xml version="1.0" encoding="UTF-8"?>
    <rss><channel>
      <item>
        <title>Chipmakers assess AI export control impact - Reuters</title>
        <source url="https://reuters.example">Reuters</source>
        <link>https://reuters.example/chips</link>
        <pubDate>Sun, 26 Apr 2026 08:10:00 GMT</pubDate>
        <description>Chipmakers assess AI export control impact&nbsp;&nbsp;Reuters</description>
      </item>
    </channel></rss>
    """

    class FakeResponse:
        def __init__(self, text: str):
            self.text = text

        def raise_for_status(self) -> None:
            return None

    def fake_get(url, **kwargs):
        if "bbc.example" in url:
            return FakeResponse(direct_feed)
        return FakeResponse(google_feed)

    monkeypatch.setattr("news_brief_mvp.live_retriever.httpx.get", fake_get)
    registry = SourceRegistry(
        weights={"default": 0.45, "bbc news": 0.93, "reuters": 0.98},
        direct_feeds=[
            SourceFeed(
                name="BBC News",
                feed_url="https://bbc.example/rss.xml",
                category="world",
                region="global",
                weight=0.93,
            )
        ],
    )

    articles = GoogleNewsRSSRetriever(registry).fetch(
        "AI chip export controls",
        limit=3,
        timeout_seconds=1.0,
    )

    assert [article.source for article in articles] == ["BBC News", "Reuters"]
    assert len({article.id for article in articles}) == len(articles)
    assert "football" not in " ".join(article.title.lower() for article in articles)
    assert articles[1].snippet == "Chipmakers assess AI export control impact"


def test_retriever_reads_atom_updated_timestamp_when_published_is_missing(monkeypatch) -> None:
    atom_feed = """<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Policy Feed</title>
      <entry>
        <title>AI chip export controls update from regulators</title>
        <link href="https://policy.example/ai-chip-export-controls" />
        <updated>2026-04-26T08:15:00Z</updated>
        <summary>Regulators described new AI chip export controls.</summary>
      </entry>
    </feed>
    """

    class FakeResponse:
        text = atom_feed

        def raise_for_status(self) -> None:
            return None

    monkeypatch.setattr("news_brief_mvp.live_retriever.httpx.get", lambda *args, **kwargs: FakeResponse())
    registry = SourceRegistry(
        weights={"default": 0.45, "policy feed": 0.8},
        direct_feeds=[
            SourceFeed(
                name="Policy Feed",
                feed_url="https://policy.example/atom.xml",
                category="policy",
                region="global",
                weight=0.8,
            )
        ],
    )

    articles = GoogleNewsRSSRetriever(registry).fetch(
        "AI chip export controls",
        limit=1,
        timeout_seconds=1.0,
    )

    assert articles[0].published_at == datetime(2026, 4, 26, 8, 15, tzinfo=timezone.utc)


def test_entry_published_at_prefers_published_string_before_update_tuple() -> None:
    entry = {
        "published": "Sun, 26 Apr 2026 08:00:00 GMT",
        "updated_parsed": (2026, 4, 26, 8, 15, 0, 0, 0, 0),
    }

    assert _entry_published_at(entry) == datetime(2026, 4, 26, 8, tzinfo=timezone.utc)
