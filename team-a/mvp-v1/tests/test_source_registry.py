import json

from news_brief_mvp.data_loader import load_source_registry, source_weight_for


def test_load_source_registry_supports_direct_feeds_and_weights(tmp_path) -> None:
    registry_path = tmp_path / "source_registry.json"
    registry_path.write_text(
        json.dumps(
            {
                "weights": {"default": 0.45, "bbc news": 0.93},
                "catalog": [
                    {
                        "id": "bbc-news",
                        "name": "BBC News",
                        "domain": "bbc.com",
                        "feed_url": "https://feeds.bbci.co.uk/news/world/rss.xml",
                        "category": "world",
                        "region": "global",
                        "weight": 0.93,
                    }
                ],
                "sources": [
                    {
                        "name": "BBC News",
                        "feed_url": "https://feeds.bbci.co.uk/news/world/rss.xml",
                        "category": "world",
                        "region": "global",
                        "weight": 0.93,
                    }
                ],
            }
        )
    )

    registry = load_source_registry(registry_path)

    assert source_weight_for("BBC News", registry) == 0.93
    assert registry.catalog[0].id == "bbc-news"
    assert registry.catalog[0].domain == "bbc.com"
    assert registry.direct_feeds[0].name == "BBC News"
    assert registry.direct_feeds[0].category == "world"
    assert registry.direct_feeds[0].region == "global"


def test_source_catalog_orders_rss_ready_outlets_before_subscription_sources(tmp_path) -> None:
    registry_path = tmp_path / "source_registry.json"
    registry_path.write_text(
        json.dumps(
            {
                "weights": {"default": 0.45},
                "catalog": [
                    {
                        "id": "reuters",
                        "name": "Reuters",
                        "domain": "reuters.com",
                        "category": "wire",
                        "region": "global",
                        "weight": 0.98,
                        "subscription_note": "Public article pages and feeds where available.",
                    },
                    {
                        "id": "bbc-news",
                        "name": "BBC News",
                        "domain": "bbc.com",
                        "feed_url": "https://feeds.bbci.co.uk/news/world/rss.xml",
                        "category": "world",
                        "region": "global",
                        "weight": 0.93,
                    },
                    {
                        "id": "financial-times",
                        "name": "Financial Times",
                        "domain": "ft.com",
                        "category": "business",
                        "region": "global",
                        "weight": 0.92,
                        "subscription_note": "Subscription integrations should use official paths.",
                    },
                ],
                "sources": [],
            }
        )
    )

    registry = load_source_registry(registry_path)

    assert [source.id for source in registry.catalog] == [
        "bbc-news",
        "reuters",
        "financial-times",
    ]

