from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Union

from .models import FallbackDataset


@dataclass(frozen=True)
class SourceFeed:
    name: str
    feed_url: str
    category: str = "general"
    region: str = "global"
    weight: float = 0.45


@dataclass(frozen=True)
class SourceRegistry:
    weights: Dict[str, float]
    direct_feeds: List[SourceFeed]

    def weight_for(self, source_name: str) -> float:
        normalized = source_name.strip().lower()
        return self.weights.get(normalized, self.weights.get("default", 0.45))


def load_source_registry(path: Path) -> SourceRegistry:
    payload = json.loads(path.read_text())
    weights = payload.get("weights", {})
    normalized_weights = {key.lower(): float(value) for key, value in weights.items()}
    direct_feeds = []
    for item in payload.get("sources", []):
        feed = SourceFeed(
            name=item["name"],
            feed_url=item["feed_url"],
            category=item.get("category", "general"),
            region=item.get("region", "global"),
            weight=float(item.get("weight", normalized_weights.get(item["name"].lower(), 0.45))),
        )
        direct_feeds.append(feed)
        normalized_weights.setdefault(feed.name.lower(), feed.weight)
    return SourceRegistry(weights=normalized_weights, direct_feeds=direct_feeds)


def source_weight_for(source_name: str, registry: Union[SourceRegistry, Dict[str, float]]) -> float:
    normalized = source_name.strip().lower()
    if isinstance(registry, SourceRegistry):
        return registry.weight_for(source_name)
    return registry.get(normalized, registry.get("default", 0.45))


def load_fallback_dataset(path: Path) -> FallbackDataset:
    payload = json.loads(path.read_text())
    return FallbackDataset.model_validate(payload)
