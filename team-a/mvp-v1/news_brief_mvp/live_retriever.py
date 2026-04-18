from __future__ import annotations

import html
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Dict, List
from urllib.parse import quote_plus

import feedparser
import httpx

from .data_loader import source_weight_for
from .models import ArticleRecord


TAG_RE = re.compile(r"<[^>]+>")


class GoogleNewsRSSRetriever:
    def __init__(self, source_registry: Dict[str, float]):
        self.source_registry = source_registry

    def fetch(self, topic: str, limit: int, timeout_seconds: float) -> List[ArticleRecord]:
        query = quote_plus(topic)
        url = (
            "https://news.google.com/rss/search"
            f"?q={query}&hl=en-US&gl=US&ceid=US:en"
        )
        response = httpx.get(
            url,
            timeout=timeout_seconds,
            headers={"User-Agent": "team-a-mvp-news-brief/1.0"},
            follow_redirects=True,
        )
        response.raise_for_status()

        feed = feedparser.parse(response.text)
        results = []
        for index, entry in enumerate(feed.entries):
            if len(results) >= limit:
                break

            raw_title = html.unescape(entry.get("title", ""))
            title = _normalize_text(raw_title)
            source_name = _extract_source(entry, raw_title)
            snippet = _normalize_text(html.unescape(TAG_RE.sub("", entry.get("summary", ""))))
            if not title or not entry.get("link"):
                continue

            article = ArticleRecord(
                id=f"live-{index}",
                title=_clean_title(raw_title, source_name),
                source=source_name,
                url=entry.get("link"),
                published_at=_parse_published_at(entry.get("published")),
                snippet=snippet,
                source_weight=source_weight_for(source_name, self.source_registry),
            )
            if article.source_weight < 0.2:
                continue
            results.append(article)

        return results


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


def _normalize_text(value: str) -> str:
    return " ".join(value.replace("\xa0", " ").split())


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
