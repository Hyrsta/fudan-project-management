from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Iterable, List, Optional
from urllib.parse import urlparse

from .models import ArticleRecord


WORD_RE = re.compile(r"[a-z0-9]+")


def _ensure_utc(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def normalize_title(title: str) -> str:
    return " ".join(WORD_RE.findall(title.lower()))


def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path.rstrip("/")
    return f"{parsed.netloc.lower().removeprefix('www.')}{path}"


def _token_set(text: str) -> set:
    return set(WORD_RE.findall(text.lower()))


def compute_freshness_score(published_at: Optional[datetime], now: datetime) -> float:
    timestamp = _ensure_utc(published_at)
    if timestamp is None:
        return 0.25
    age_hours = max((now - timestamp).total_seconds() / 3600, 0.0)
    if age_hours <= 6:
        return 1.0
    if age_hours <= 24:
        return 0.85
    if age_hours <= 72:
        return 0.65
    if age_hours <= 168:
        return 0.45
    return 0.25


def compute_match_score(article: ArticleRecord, topic: str) -> float:
    topic_tokens = _token_set(topic)
    article_tokens = _token_set(f"{article.title} {article.snippet}")
    if not topic_tokens:
        return 0.0
    overlap = len(topic_tokens & article_tokens)
    return min(overlap / len(topic_tokens), 1.0)


def score_articles(
    articles: Iterable[ArticleRecord], topic: str, now: Optional[datetime] = None
) -> List[ArticleRecord]:
    now = _ensure_utc(now) or datetime.now(timezone.utc)
    scored = []
    for article in articles:
        freshness = compute_freshness_score(article.published_at, now)
        match = compute_match_score(article, topic)
        total = round((article.source_weight * 0.45) + (freshness * 0.35) + (match * 0.20), 4)
        scored.append(
            article.model_copy(
                update={
                    "freshness_score": round(freshness, 4),
                    "match_score": round(match, 4),
                    "total_score": total,
                }
            )
        )
    return sorted(scored, key=lambda item: item.total_score, reverse=True)


def deduplicate_articles(articles: Iterable[ArticleRecord]) -> List[ArticleRecord]:
    selected = {}
    for article in articles:
        title_key = normalize_title(article.title)
        url_key = normalize_url(article.url)
        candidate_keys = [url_key]
        if title_key:
            candidate_keys.append(title_key)

        match_key = None
        for key in candidate_keys:
            if key in selected:
                match_key = key
                break

        if match_key is None:
            selected[url_key] = article
            if title_key:
                selected[title_key] = article
            continue

        existing = selected[match_key]
        existing_score = existing.total_score or existing.source_weight
        current_score = article.total_score or article.source_weight
        if current_score > existing_score:
            selected[url_key] = article
            if title_key:
                selected[title_key] = article

    unique = {}
    for article in selected.values():
        unique[article.id] = article
    return sorted(unique.values(), key=lambda item: item.total_score, reverse=True)

