from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


BriefMode = Literal["auto", "live", "fallback"]
Persona = Literal[
    "research_analyst",
    "financial_analyst",
    "executive_brief",
    "market_watch",
    "policy_intelligence",
    "academic_researcher",
    "risk_analyst",
]


class BriefRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: str = Field(min_length=1, max_length=200)
    mode: BriefMode = "auto"
    persona: Persona = "research_analyst"
    goal: str = Field(default="", max_length=240)

    @field_validator("topic")
    @classmethod
    def strip_topic(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Topic must not be empty.")
        return stripped

    @field_validator("goal")
    @classmethod
    def strip_goal(cls, value: str) -> str:
        return " ".join(value.strip().split())


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


class SourceCatalogItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=120)
    domain: str = Field(default="", max_length=160)
    feed_url: str = Field(default="", max_length=260)
    category: str = Field(default="general", max_length=80)
    region: str = Field(default="global", max_length=80)
    weight: float = Field(default=0.45, ge=0.0, le=1.0)
    subscription_note: str = Field(default="", max_length=180)

    @field_validator("id", "domain")
    @classmethod
    def normalize_identifier(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("name", "feed_url", "category", "region", "subscription_note")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return " ".join(value.strip().split())


class CustomTrustedSource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(default="", max_length=90)
    name: str = Field(min_length=1, max_length=120)
    domain: str = Field(default="", max_length=160)
    feed_url: str = Field(default="", max_length=260)
    weight: float = Field(default=0.96, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def normalize_custom_source(self) -> "CustomTrustedSource":
        self.name = " ".join(self.name.strip().split())
        self.domain = _normalize_domain(self.domain)
        self.feed_url = self.feed_url.strip()
        if not self.domain and not self.feed_url:
            raise ValueError("Custom trusted sources require a domain or RSS feed URL.")
        if not self.id:
            self.id = f"custom-{_slugify(self.name) or _slugify(self.domain) or _slugify(self.feed_url) or 'source'}"
        else:
            self.id = _slugify(self.id) or _slugify(self.name) or _slugify(self.domain) or "source"
            if not self.id.startswith("custom-"):
                self.id = f"custom-{self.id}"
        return self


class TrustedSourceSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    selected_source_ids: List[str] = Field(default_factory=list, max_length=24)
    custom_sources: List[CustomTrustedSource] = Field(default_factory=list, max_length=12)

    @field_validator("selected_source_ids")
    @classmethod
    def normalize_selected_source_ids(cls, values: List[str]) -> List[str]:
        seen = set()
        normalized = []
        for value in values:
            item = _slugify(value)
            if item and item not in seen:
                seen.add(item)
                normalized.append(item)
        return normalized


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


class ReportConfidence(BaseModel):
    model_config = ConfigDict(extra="forbid")

    score: int = 0
    level: str = "Developing"
    source_diversity: str = "Limited"
    freshness: str = "Unknown"
    topic_fit: str = "Unknown"
    rationale: List[str] = Field(default_factory=list)


class BriefResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    brief_id: str
    topic: str
    created_at: datetime
    mode_used: Literal["live", "fallback"]
    section_generation_mode: SectionGenerationMode
    persona: Persona = "research_analyst"
    persona_label: str = "Research analyst"
    goal: str = ""
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
    lens_focus: List[str] = Field(default_factory=list)
    section_titles: Dict[str, str] = Field(default_factory=dict)
    confidence: ReportConfidence = Field(default_factory=ReportConfidence)

    def to_handoff_artifact(self) -> "HandoffArtifact":
        return HandoffArtifact(
            brief_id=self.brief_id,
            topic=self.topic,
            created_at=self.created_at,
            mode_used=self.mode_used,
            section_generation_mode=self.section_generation_mode,
            persona=self.persona,
            persona_label=self.persona_label,
            goal=self.goal,
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
            lens_focus=self.lens_focus,
            section_titles=self.section_titles,
            confidence=self.confidence,
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
    persona: Persona = "research_analyst"
    persona_label: str = "Research analyst"
    goal: str = ""
    selected_source_ids: List[str]
    sections: Dict[str, object]
    source_evidence: List[SourceEvidence] = Field(default_factory=list)
    pipeline_metadata: Dict[str, object] = Field(default_factory=dict)
    quality_notes: List[str] = Field(default_factory=list)
    lens_focus: List[str] = Field(default_factory=list)
    section_titles: Dict[str, str] = Field(default_factory=dict)
    confidence: ReportConfidence = Field(default_factory=ReportConfidence)
    export_paths: Dict[str, str] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)


class FallbackDataset(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dataset_topic: str
    articles: List[ArticleRecord]
    precomputed_sections: BriefSections


def _normalize_domain(value: str) -> str:
    domain = value.strip().lower()
    for prefix in ("https://", "http://"):
        if domain.startswith(prefix):
            domain = domain[len(prefix):]
    domain = domain.split("/", 1)[0]
    return domain[4:] if domain.startswith("www.") else domain


def _slugify(value: str) -> str:
    text = value.strip().lower()
    chars = []
    last_dash = False
    for char in text:
        if char.isalnum():
            chars.append(char)
            last_dash = False
        elif not last_dash:
            chars.append("-")
            last_dash = True
    return "".join(chars).strip("-")
