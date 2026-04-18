from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


BriefMode = Literal["auto", "live", "fallback"]
Persona = Literal[
    "research_analyst",
    "executive_brief",
    "market_watch",
    "policy_intelligence",
]


class BriefRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: str = Field(min_length=1, max_length=200)
    mode: BriefMode = "auto"
    persona: Persona = "research_analyst"

    @field_validator("topic")
    @classmethod
    def strip_topic(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Topic must not be empty.")
        return stripped


class ArticleRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    source: str
    url: str
    published_at: Optional[datetime] = None
    snippet: str = ""
    summary: Optional[str] = None
    source_weight: float = 0.0
    freshness_score: float = 0.0
    match_score: float = 0.0
    total_score: float = 0.0


class ArticleCitation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    article_id: str
    title: str
    source: str
    url: str
    published_at: Optional[datetime] = None


class BriefSections(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overview: str
    key_takeaways: List[str]
    framing_comparison: str
    uncertainties: List[str]


SectionGenerationMode = Literal["llm", "heuristic", "precomputed"]


class BriefResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    brief_id: str
    topic: str
    created_at: datetime
    mode_used: Literal["live", "fallback"]
    section_generation_mode: SectionGenerationMode
    articles: List[ArticleRecord]
    overview: str
    key_takeaways: List[str]
    framing_comparison: str
    uncertainties: List[str]
    citations: List[ArticleCitation]
    export_html_path: str
    warnings: List[str] = Field(default_factory=list)


class HandoffArtifact(BaseModel):
    model_config = ConfigDict(extra="forbid")

    brief_id: str
    topic: str
    created_at: datetime
    mode_used: Literal["live", "fallback"]
    section_generation_mode: SectionGenerationMode
    selected_source_ids: List[str]
    sections: Dict[str, object]
    warnings: List[str] = Field(default_factory=list)


class FallbackDataset(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset_topic: str
    articles: List[ArticleRecord]
    precomputed_sections: BriefSections
