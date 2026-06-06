"""External news-API providers.

Each provider accepts an optional `api_key` and exposes `.fetch(topic, limit)`
returning a list of ArticleRecord. The provider does NO scoring or
deduplication — that stays in ranking.py. Providers ARE responsible for:
- talking to their upstream JSON API
- converting the response into ArticleRecord
- being honest about credibility weight (source registry assigns 0.45 as a
  fallback for unlisted outlets; providers can override per-article)

Adding a new provider:
1. Subclass NewsProvider
2. Append it to PROVIDER_REGISTRY
3. Wire its X-Provider-<id>-Key header read in main.py.create_brief
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional

import httpx

from .models import ArticleRecord


@dataclass
class ProviderSpec:
    """Static metadata about a provider, surfaced to the frontend."""

    id: str          # short slug, used in localStorage key + HTTP header
    name: str        # human-readable display name
    blurb: str       # one-sentence description
    signup_url: str  # where the user goes to get a key
    body_access: str # "full" | "metadata" | "snippet"


class NewsProvider:
    spec: ProviderSpec

    def __init__(self, api_key: Optional[str]):
        self.api_key = api_key

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def fetch(self, topic: str, limit: int, timeout_seconds: float) -> List[ArticleRecord]:
        raise NotImplementedError


# ----- The Guardian Open Platform --------------------------------------------
# Free for non-commercial use; full article body available via show-fields=body.
# Docs: https://open-platform.theguardian.com/documentation/search

class GuardianProvider(NewsProvider):
    spec = ProviderSpec(
        id="guardian",
        name="The Guardian",
        blurb="Self-serve free key. Full article body and metadata via Open Platform.",
        signup_url="https://open-platform.theguardian.com/access/",
        body_access="full",
    )

    BASE_URL = "https://content.guardianapis.com/search"

    def fetch(self, topic: str, limit: int, timeout_seconds: float) -> List[ArticleRecord]:
        if not self.is_configured:
            return []

        try:
            response = httpx.get(
                self.BASE_URL,
                timeout=timeout_seconds,
                params={
                    "q": topic,
                    "page-size": min(limit, 50),
                    "order-by": "newest",
                    "show-fields": "trailText,body,byline",
                    "api-key": self.api_key,
                },
                headers={"User-Agent": "team-a-final-news-brief/1.0"},
            )
            response.raise_for_status()
            payload = response.json()
        except Exception:
            return []

        results: List[ArticleRecord] = []
        for entry in payload.get("response", {}).get("results", []):
            try:
                published_iso = entry.get("webPublicationDate", "")
                published_at = _parse_iso(published_iso)
                fields = entry.get("fields", {}) or {}
                snippet = _strip_tags(fields.get("trailText", "")) or _strip_tags(fields.get("body", ""))[:300]
                results.append(
                    ArticleRecord(
                        id=f"guardian-{entry.get('id', '')}",
                        title=entry.get("webTitle", ""),
                        source="The Guardian",
                        url=entry.get("webUrl", ""),
                        published_at=published_at,
                        snippet=snippet,
                        summary=_strip_tags(fields.get("body", ""))[:1000] or None,
                        source_weight=0.88,
                    )
                )
            except Exception:
                continue
        return results[:limit]


# ----- New York Times Article Search ----------------------------------------
# Free dev key; returns headline + abstract + lead_paragraph (NOT full body).
# Docs: https://developer.nytimes.com/docs/articlesearch-product/1/overview

class NYTProvider(NewsProvider):
    spec = ProviderSpec(
        id="nyt",
        name="New York Times",
        blurb="Self-serve free key. Headlines, abstracts, and lead paragraphs (no body).",
        signup_url="https://developer.nytimes.com/get-started",
        body_access="metadata",
    )

    BASE_URL = "https://api.nytimes.com/svc/search/v2/articlesearch.json"

    def fetch(self, topic: str, limit: int, timeout_seconds: float) -> List[ArticleRecord]:
        if not self.is_configured:
            return []

        try:
            response = httpx.get(
                self.BASE_URL,
                timeout=timeout_seconds,
                params={
                    "q": topic,
                    "sort": "newest",
                    "api-key": self.api_key,
                },
                headers={"User-Agent": "team-a-final-news-brief/1.0"},
            )
            response.raise_for_status()
            payload = response.json()
        except Exception:
            return []

        results: List[ArticleRecord] = []
        for entry in payload.get("response", {}).get("docs", []):
            try:
                published_at = _parse_iso(entry.get("pub_date", ""))
                headline = (entry.get("headline") or {}).get("main", "")
                snippet = entry.get("abstract") or entry.get("lead_paragraph", "")
                results.append(
                    ArticleRecord(
                        id=f"nyt-{entry.get('_id', '')}",
                        title=headline,
                        source="The New York Times",
                        url=entry.get("web_url", ""),
                        published_at=published_at,
                        snippet=snippet,
                        summary=entry.get("lead_paragraph") or None,
                        source_weight=0.92,
                    )
                )
            except Exception:
                continue
            if len(results) >= limit:
                break
        return results


# ----- Registry --------------------------------------------------------------

PROVIDER_REGISTRY = {
    GuardianProvider.spec.id: GuardianProvider,
    NYTProvider.spec.id: NYTProvider,
}


def build_providers(provider_keys: dict) -> List[NewsProvider]:
    """Instantiate every registered provider with its key (or None)."""
    out: List[NewsProvider] = []
    for slug, cls in PROVIDER_REGISTRY.items():
        out.append(cls(api_key=(provider_keys or {}).get(slug)))
    return out


def provider_catalog() -> List[dict]:
    """Catalog rendered to the frontend so it can show provider cards."""
    out = []
    for cls in PROVIDER_REGISTRY.values():
        s = cls.spec
        out.append({
            "id": s.id,
            "name": s.name,
            "blurb": s.blurb,
            "signup_url": s.signup_url,
            "body_access": s.body_access,
        })
    return out


# ----- helpers ---------------------------------------------------------------

import re as _re

_TAG_RE = _re.compile(r"<[^>]+>")


def _strip_tags(s: str) -> str:
    if not s:
        return ""
    return _TAG_RE.sub("", s).strip()


def _parse_iso(s: str) -> Optional[datetime]:
    if not s:
        return None
    try:
        # Guardian: 2026-04-23T00:27:00Z; NYT: 2026-04-23T00:27:00+0000
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        return datetime.fromisoformat(s)
    except Exception:
        return None
