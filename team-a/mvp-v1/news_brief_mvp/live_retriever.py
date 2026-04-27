from __future__ import annotations

import html
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import List, Optional
from urllib.parse import quote_plus

import feedparser
import httpx

from .data_loader import SourceFeed, SourceRegistry, source_weight_for
from .models import ArticleRecord


TAG_RE = re.compile(r"<[^>]+>")
WORD_RE = re.compile(r"[a-z0-9]+")


class GoogleNewsRSSRetriever:
    def __init__(self, source_registry: SourceRegistry):
        self.source_registry = source_registry

    def fetch(self, topic: str, limit: int, timeout_seconds: float) -> List[ArticleRecord]:
        results = []
        for feed in self.source_registry.direct_feeds:
            if len(results) >= limit:
                break
            try:
                results.extend(
                    self._fetch_feed(
                        url=feed.feed_url,
                        topic=topic,
                        limit=limit - len(results),
                        timeout_seconds=timeout_seconds,
                        feed_source=feed,
                    )
                )
            except Exception:
                continue

        if len(results) < limit:
            try:
                results.extend(
                    self._fetch_feed(
                        url=_google_news_url(topic),
                        topic=topic,
                        limit=limit - len(results),
                        timeout_seconds=timeout_seconds,
                        feed_source=None,
                    )
                )
            except Exception:
                if not results:
                    raise

        return _dedupe_records(results)[:limit]

    def _fetch_feed(
        self,
        url: str,
        topic: str,
        limit: int,
        timeout_seconds: float,
        feed_source: Optional[SourceFeed],
    ) -> List[ArticleRecord]:
        response = httpx.get(
            url,
            timeout=timeout_seconds,
            headers={"User-Agent": "team-a-final-news-brief/1.0"},
            follow_redirects=True,
        )
        response.raise_for_status()

        feed = feedparser.parse(response.text)
        results = []
        for index, entry in enumerate(feed.entries):
            if len(results) >= limit:
                break
            article = _entry_to_article(
                entry=entry,
                index=index,
                topic=topic,
                registry=self.source_registry,
                feed_source=feed_source,
            )
            if article is None:
                continue
            results.append(article)
        return results


def _google_news_url(topic: str) -> str:
    query = quote_plus(topic)
    return (
        "https://news.google.com/rss/search"
        f"?q={query}&hl=en-US&gl=US&ceid=US:en"
    )


def _entry_to_article(entry, index: int, topic: str, registry: SourceRegistry, feed_source: Optional[SourceFeed]):
    raw_title = html.unescape(entry.get("title", ""))
    source_name = feed_source.name if feed_source is not None else _extract_source(entry, raw_title)
    title = _clean_title(raw_title, source_name)
    snippet = _clean_snippet(entry.get("summary", ""), source_name)
    if not title or not entry.get("link"):
        return None
    if not _is_topic_relevant(topic, f"{title} {snippet}"):
        return None

    article = ArticleRecord(
        id=f"live-{index}",
        title=title,
        source=source_name,
        url=entry.get("link"),
        published_at=_parse_published_at(entry.get("published")),
        snippet=snippet,
        source_weight=source_weight_for(source_name, registry),
    )
    if article.source_weight < 0.2:
        return None
    return article


def _extract_source(entry, title: str) -> str:
    source = entry.get("source")
    if hasattr(source, "get"):
        source_title = source.get("title")
        if source_title:
            return _normalize_text(html.unescape(source_title))
    normalized_title = _normalize_text(title)
    if " - " in normalized_title:
        return normalized_title.rsplit(" - ", 1)[-1].strip()
    return "Google News"


def _clean_title(title: str, source_name: str) -> str:
    cleaned = title.replace("\xa0", " ")
    if source_name:
        escaped_source = re.escape(source_name)
        cleaned = re.sub(rf"(?:\s*[-–—]\s*|\s{{2,}}){escaped_source}\s*$", "", cleaned)
    return _normalize_text(cleaned)


def _clean_snippet(snippet: str, source_name: str) -> str:
    cleaned = html.unescape(TAG_RE.sub("", snippet or ""))
    return _clean_title(cleaned, source_name)


def _normalize_text(value: str) -> str:
    return " ".join(value.replace("\xa0", " ").split())


def _is_topic_relevant(topic: str, text: str) -> bool:
    topic_tokens = set(WORD_RE.findall(topic.lower()))
    if not topic_tokens:
        return False
    text_lower = text.lower()
    if topic.lower().strip() in text_lower:
        return True
    text_tokens = set(WORD_RE.findall(text_lower))
    overlap = len(topic_tokens & text_tokens)
    if len(topic_tokens) == 1:
        return overlap > 0
    return (overlap / len(topic_tokens)) >= 0.25


def _dedupe_records(records: List[ArticleRecord]) -> List[ArticleRecord]:
    seen = set()
    deduped = []
    for record in records:
        key = (record.url.strip().lower(), record.title.strip().lower())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(record)
    return deduped


def _parse_published_at(value: str):
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)
