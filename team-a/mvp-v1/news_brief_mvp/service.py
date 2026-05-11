from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import List, Sequence
from uuid import uuid4

from .data_loader import load_fallback_dataset, load_source_registry
from .live_retriever import GoogleNewsRSSRetriever
from .llm import OpenAICompatibleLLMClient
from .local_sections import build_heuristic_sections
from .models import (
    ArticleCitation,
    ArticleRecord,
    BriefRequest,
    BriefResponse,
    BriefSections,
    FallbackDataset,
    SectionGenerationMode,
    SourceEvidence,
)
from .personas import get_persona_definition
from .ranking import deduplicate_articles, score_articles
from .storage import ArtifactStore


class LiveRunFailed(RuntimeError):
    """Raised when an explicit live run cannot be completed."""


class BriefService:
    def __init__(
        self,
        live_retriever,
        llm_client,
        artifact_store: ArtifactStore,
        fallback_dataset: FallbackDataset,
        minimum_live_articles: int = 4,
        retrieval_limit: int = 15,
        timeout_seconds: float = 10.0,
    ):
        self.live_retriever = live_retriever
        self.llm_client = llm_client
        self.artifact_store = artifact_store
        self.fallback_dataset = fallback_dataset
        self.minimum_live_articles = minimum_live_articles
        self.retrieval_limit = retrieval_limit
        self.timeout_seconds = timeout_seconds

    def generate_brief(self, request_model: BriefRequest) -> BriefResponse:
        mode_used = "live"
        warnings: List[str] = []
        persona_definition = get_persona_definition(request_model.persona)

        if request_model.mode == "fallback":
            mode_used = "fallback"
            warnings.append("fallback_used")
            selected_articles = self._prepare_fallback_articles(request_model.topic)
        else:
            try:
                live_articles = self.live_retriever.fetch(
                    request_model.topic,
                    limit=self.retrieval_limit,
                    timeout_seconds=self.timeout_seconds,
                )
            except Exception as exc:
                if request_model.mode == "live":
                    raise LiveRunFailed("Live retrieval failed. Please retry the request.") from exc
                live_articles = []
                warnings.append("live_results_incomplete")

            selected_articles = self._prepare_live_articles(live_articles, request_model.topic)
            if len(selected_articles) < self.minimum_live_articles:
                if request_model.mode == "live":
                    raise LiveRunFailed(
                        "Live retrieval returned too few usable articles. Please retry the request."
                    )
                mode_used = "fallback"
                if "live_results_incomplete" not in warnings:
                    warnings.append("live_results_incomplete")
                warnings.append("fallback_used")
                selected_articles = self._prepare_fallback_articles(request_model.topic)

        sections, section_generation_mode = self._generate_sections(
            topic=request_model.topic,
            persona=request_model.persona,
            goal=request_model.goal,
            articles=selected_articles,
            mode_used=mode_used,
            warnings=warnings,
        )

        brief_id = f"brief-{uuid4().hex[:10]}"
        created_at = datetime.now(timezone.utc)
        confidence = _build_confidence(selected_articles, warnings=warnings, mode_used=mode_used)
        citations = [
            ArticleCitation(
                article_id=article.id,
                title=article.title,
                source=article.source,
                url=article.url,
                published_at=article.published_at,
            )
            for article in selected_articles
        ]
        response = BriefResponse(
            brief_id=brief_id,
            topic=request_model.topic,
            created_at=created_at,
            mode_used=mode_used,
            section_generation_mode=section_generation_mode,
            persona=request_model.persona,
            persona_label=persona_definition.label,
            goal=request_model.goal,
            articles=selected_articles,
            overview=sections.overview,
            executive_summary=sections.overview,
            key_takeaways=sections.key_takeaways,
            key_facts=sections.key_facts or _fallback_key_facts(selected_articles),
            framing_comparison=sections.framing_comparison,
            insights=sections.insights or _fallback_insights(selected_articles),
            uncertainties=sections.uncertainties,
            risk_notes=sections.risk_notes or sections.uncertainties,
            citations=citations,
            source_evidence=_build_source_evidence(selected_articles),
            export_html_path=str(self.artifact_store.export_path(brief_id)),
            markdown_export_path=str(self.artifact_store.markdown_path(brief_id)),
            pipeline_metadata={
                "collector": "fallback_dataset" if mode_used == "fallback" else "multi_source_rss",
                "ranker": "credibility_freshness_topic",
                "summarizer": section_generation_mode,
                "comparison": section_generation_mode,
                "insight": section_generation_mode,
                "report": section_generation_mode,
                "persona": persona_definition.as_metadata(),
                "goal": request_model.goal,
            },
            quality_notes=_build_quality_notes(
                mode_used=mode_used,
                section_generation_mode=section_generation_mode,
                article_count=len(selected_articles),
                warnings=warnings,
            ),
            warnings=list(dict.fromkeys(warnings)),
            lens_focus=persona_definition.focus,
            section_titles=persona_definition.section_titles,
            confidence=confidence,
        )
        handoff = response.to_handoff_artifact()
        self.artifact_store.save(response, handoff)
        return response

    def load_brief_response(self, brief_id: str) -> BriefResponse:
        return self.artifact_store.load_brief(brief_id)

    def load_handoff(self, brief_id: str) -> HandoffArtifact:
        return self.artifact_store.load_handoff(brief_id)

    def get_export_path(self, brief_id: str) -> Path:
        return self.artifact_store.export_path(brief_id)

    def get_markdown_path(self, brief_id: str) -> Path:
        return self.artifact_store.markdown_path(brief_id)

    def list_recent_briefs(self, limit: int = 6) -> List[BriefResponse]:
        return self.artifact_store.list_briefs(limit=limit)

    def delete_brief(self, brief_id: str) -> None:
        self.artifact_store.delete_brief(brief_id)

    def _prepare_live_articles(self, articles: Sequence[ArticleRecord], topic: str) -> List[ArticleRecord]:
        scored = score_articles(articles, topic=topic)
        deduplicated = deduplicate_articles(scored)
        relevant = [article for article in deduplicated if article.match_score >= 0.45]
        return relevant[:5]

    def _prepare_fallback_articles(self, topic: str) -> List[ArticleRecord]:
        scored = score_articles(self.fallback_dataset.articles, topic=topic)
        return deduplicate_articles(scored)[:5]

    def _generate_sections(
        self,
        topic: str,
        persona: str,
        goal: str,
        articles: Sequence[ArticleRecord],
        mode_used: str,
        warnings: List[str],
    ) -> tuple[BriefSections, SectionGenerationMode]:
        try:
            sections = self.llm_client.generate_sections(
                topic=topic,
                persona=persona,
                goal=goal,
                articles=articles,
            )
            return sections, "llm"
        except Exception:
            warnings.append("llm_generation_failed")
            try:
                sections = build_heuristic_sections(
                    topic=topic,
                    persona=persona,
                    goal=goal,
                    articles=articles,
                )
                warnings.append("heuristic_sections_used")
                return sections, "heuristic"
            except Exception as exc:
                if mode_used == "fallback":
                    warnings.append("precomputed_sections_used")
                    return self.fallback_dataset.precomputed_sections, "precomputed"
                raise LiveRunFailed("The live report model failed. Please retry the request.") from exc


def build_default_service(app_root: Path) -> BriefService:
    package_root = app_root / "news_brief_mvp"
    source_registry = load_source_registry(package_root / "data" / "source_registry.json")
    fallback_dataset = load_fallback_dataset(package_root / "data" / "fallback_dataset.json")
    artifact_store = ArtifactStore(app_root / "artifacts")
    return BriefService(
        live_retriever=GoogleNewsRSSRetriever(source_registry),
        llm_client=OpenAICompatibleLLMClient(
            package_root / "prompts" / "brief_sections_prompt.txt"
        ),
        artifact_store=artifact_store,
        fallback_dataset=fallback_dataset,
    )


def _build_source_evidence(articles: Sequence[ArticleRecord]) -> List[SourceEvidence]:
    evidence = []
    for article in articles:
        reasons = []
        if article.source_weight >= 0.8:
            reasons.append("high source trust")
        if article.freshness_score >= 0.8:
            reasons.append("recent coverage")
        if article.match_score >= 0.5:
            reasons.append("strong topic fit")
        if not reasons:
            reasons.append("adds context to the selected coverage")
        evidence.append(
            SourceEvidence(
                article_id=article.id,
                title=article.title,
                source=article.source,
                url=article.url,
                published_at=article.published_at,
                credibility_score=article.source_weight,
                freshness_score=article.freshness_score,
                topic_fit=article.match_score,
                why_selected=", ".join(reasons).capitalize() + ".",
            )
        )
    return evidence


def _fallback_key_facts(articles: Sequence[ArticleRecord]) -> List[str]:
    facts = []
    for article in articles[:4]:
        signal = article.summary or article.snippet or article.title
        facts.append(f"{article.source}: {' '.join(signal.split())}")
    return facts


def _fallback_insights(articles: Sequence[ArticleRecord]) -> List[str]:
    sources = []
    for article in articles:
        if article.source not in sources:
            sources.append(article.source)
    return [
        f"The report is grounded in {len(articles)} selected sources rather than a single blended answer.",
        f"Visible source diversity includes {', '.join(sources[:4])}.",
    ]


def _build_confidence(
    articles: Sequence[ArticleRecord],
    warnings: Sequence[str],
    mode_used: str,
):
    from .models import ReportConfidence

    if not articles:
        return ReportConfidence(
            score=0,
            level="Developing",
            source_diversity="No sources",
            freshness="Unknown",
            topic_fit="Unknown",
            rationale=["No usable source records were available."],
        )

    unique_sources = {article.source.strip().lower() for article in articles if article.source.strip()}
    diversity_ratio = min(1.0, len(unique_sources) / 4)
    avg_freshness = sum(article.freshness_score for article in articles) / len(articles)
    avg_fit = sum(article.match_score for article in articles) / len(articles)
    avg_trust = sum(article.source_weight for article in articles) / len(articles)
    raw_score = (avg_trust * 0.35) + (avg_fit * 0.30) + (avg_freshness * 0.20) + (diversity_ratio * 0.15)
    if mode_used == "fallback":
        raw_score -= 0.08
    if "live_results_incomplete" in warnings:
        raw_score -= 0.08
    score = max(0, min(100, round(raw_score * 100)))
    if score >= 75:
        level = "High"
    elif score >= 50:
        level = "Medium"
    else:
        level = "Developing"

    rationale = [
        f"{len(unique_sources)} distinct sources are represented.",
        f"Average topic fit is {_score_label(avg_fit).lower()}.",
    ]
    if mode_used == "fallback":
        rationale.append("Saved source coverage was used for reliability.")
    if "live_results_incomplete" in warnings:
        rationale.append("Live coverage was incomplete in this run.")

    return ReportConfidence(
        score=score,
        level=level,
        source_diversity=_diversity_label(len(unique_sources)),
        freshness=_score_label(avg_freshness),
        topic_fit=_score_label(avg_fit),
        rationale=rationale,
    )


def _diversity_label(source_count: int) -> str:
    if source_count >= 4:
        return "Broad"
    if source_count >= 2:
        return "Moderate"
    return "Limited"


def _score_label(score: float) -> str:
    if score >= 0.75:
        return "Strong"
    if score >= 0.45:
        return "Moderate"
    return "Limited"


def _build_quality_notes(
    mode_used: str,
    section_generation_mode: SectionGenerationMode,
    article_count: int,
    warnings: Sequence[str],
) -> List[str]:
    notes = [
        f"Report generated from {article_count} ranked source records.",
        "Every delivered report includes source links and selected-source evidence.",
    ]
    if mode_used == "fallback":
        notes.append("Saved source coverage was used because live source coverage was unavailable or limited.")
    if section_generation_mode != "llm":
        notes.append("Sections were generated with the deterministic local report builder.")
    if "live_results_incomplete" in warnings:
        notes.append("Live retrieval was incomplete for this run.")
    return notes
