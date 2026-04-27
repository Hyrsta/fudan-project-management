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


class SourceEvidence(BaseModel):
    model_config = ConfigDict(extra="forbid")

    article_id: str
    title: str
    source: str
    url: str
    published_at: Optional[datetime] = None
    credibility_score: float = 0.0
    freshness_score: float = 0.0
    topic_fit: float = 0.0
    why_selected: str = ""


class BriefSections(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overview: str
    key_takeaways: List[str]
    key_facts: List[str] = Field(default_factory=list)
    framing_comparison: str
    insights: List[str] = Field(default_factory=list)
    uncertainties: List[str]
    risk_notes: List[str] = Field(default_factory=list)


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
    executive_summary: str = ""
    key_takeaways: List[str]
    key_facts: List[str] = Field(default_factory=list)
    framing_comparison: str
    insights: List[str] = Field(default_factory=list)
    uncertainties: List[str]
    risk_notes: List[str] = Field(default_factory=list)
    citations: List[ArticleCitation]
    source_evidence: List[SourceEvidence] = Field(default_factory=list)
    export_html_path: str
    markdown_export_path: str = ""
    pipeline_metadata: Dict[str, object] = Field(default_factory=dict)
    quality_notes: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

    def to_handoff_artifact(self) -> "HandoffArtifact":
        return HandoffArtifact(
            brief_id=self.brief_id,
            topic=self.topic,
            created_at=self.created_at,
            mode_used=self.mode_used,
            section_generation_mode=self.section_generation_mode,
            selected_source_ids=[article.id for article in self.articles],
            sections={
                "executive_summary": self.executive_summary or self.overview,
                "overview": self.overview,
                "key_takeaways": self.key_takeaways,
                "key_facts": self.key_facts,
                "framing_comparison": self.framing_comparison,
                "insights": self.insights,
                "uncertainties": self.uncertainties,
                "risk_notes": self.risk_notes or self.uncertainties,
            },
            source_evidence=self.source_evidence,
            pipeline_metadata=self.pipeline_metadata,
            quality_notes=self.quality_notes,
            export_paths={
                "html": self.export_html_path,
                "markdown": self.markdown_export_path,
            },
            warnings=self.warnings,
        )


class HandoffArtifact(BaseModel):
    model_config = ConfigDict(extra="forbid")

    brief_id: str
    topic: str
    created_at: datetime
    mode_used: Literal["live", "fallback"]
    section_generation_mode: SectionGenerationMode
    selected_source_ids: List[str]
    sections: Dict[str, object]
    source_evidence: List[SourceEvidence] = Field(default_factory=list)
    pipeline_metadata: Dict[str, object] = Field(default_factory=dict)
    quality_notes: List[str] = Field(default_factory=list)
    export_paths: Dict[str, str] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)


class FallbackDataset(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset_topic: str
    articles: List[ArticleRecord]
    precomputed_sections: BriefSections
