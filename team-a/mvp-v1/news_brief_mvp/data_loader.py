from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Union

from .models import FallbackDataset, SourceCatalogItem


@dataclass(frozen=True)
class SourceFeed:
    name: str
    feed_url: str
    category: str = "general"
    region: str = "global"
    weight: float = 0.45
    id: str = ""
    domain: str = ""


@dataclass(frozen=True)
class SourceRegistry:
    weights: Dict[str, float]
    direct_feeds: List[SourceFeed]
    catalog: List[SourceCatalogItem] = field(default_factory=list)

    def weight_for(self, source_name: str) -> float:
        normalized = source_name.strip().lower()
        return self.weights.get(normalized, self.weights.get("default", 0.45))

    def catalog_by_id(self) -> Dict[str, SourceCatalogItem]:
        return {item.id: item for item in self.catalog}


def load_source_registry(path: Path) -> SourceRegistry:
    payload = json.loads(path.read_text())
    weights = payload.get("weights", {})
    normalized_weights = {key.lower(): float(value) for key, value in weights.items()}
    catalog = [SourceCatalogItem.model_validate(item) for item in payload.get("catalog", [])]
    direct_feeds = []
    for item in payload.get("sources", []):
        feed = SourceFeed(
            name=item["name"],
            feed_url=item["feed_url"],
            category=item.get("category", "general"),
            region=item.get("region", "global"),
            weight=float(item.get("weight", normalized_weights.get(item["name"].lower(), 0.45))),
            id=item.get("id", ""),
            domain=item.get("domain", ""),
        )
        direct_feeds.append(feed)
        normalized_weights.setdefault(feed.name.lower(), feed.weight)
        if feed.id and not any(source.id == feed.id for source in catalog):
            catalog.append(
                SourceCatalogItem(
                    id=feed.id,
                    name=feed.name,
                    domain=feed.domain,
                    feed_url=feed.feed_url,
                    category=feed.category,
                    region=feed.region,
                    weight=feed.weight,
                )
            )
    return SourceRegistry(
        weights=normalized_weights,
        direct_feeds=direct_feeds,
        catalog=sorted(catalog, key=_source_catalog_sort_key),
    )


def source_weight_for(source_name: str, registry: Union[SourceRegistry, Dict[str, float]]) -> float:
    normalized = source_name.strip().lower()
    if isinstance(registry, SourceRegistry):
        return registry.weight_for(source_name)
    return registry.get(normalized, registry.get("default", 0.45))


def _source_catalog_sort_key(source: SourceCatalogItem) -> tuple[int, float, str]:
    return (0 if source.feed_url else 1, -source.weight, source.name.lower())


def load_fallback_dataset(path: Path) -> FallbackDataset:
    payload = json.loads(path.read_text())
    return FallbackDataset.model_validate(payload)
