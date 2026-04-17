from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

from .models import FallbackDataset


def load_source_registry(path: Path) -> Dict[str, float]:
    payload = json.loads(path.read_text())
    weights = payload.get("weights", {})
    return {key.lower(): float(value) for key, value in weights.items()}


def source_weight_for(source_name: str, registry: Dict[str, float]) -> float:
    normalized = source_name.strip().lower()
    return registry.get(normalized, registry.get("default", 0.45))


def load_fallback_dataset(path: Path) -> FallbackDataset:
    payload = json.loads(path.read_text())
    return FallbackDataset.model_validate(payload)

