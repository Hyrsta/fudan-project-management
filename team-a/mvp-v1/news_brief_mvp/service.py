from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import List, Sequence
from uuid import uuid4

from .data_loader import load_fallback_dataset, load_source_registry
from .live_retriever import GoogleNewsRSSRetriever
from .llm import OpenAICompatibleLLMClient
from .models import (
    ArticleCitation,
    ArticleRecord,
    BriefRequest,
    BriefResponse,
    BriefSections,
    FallbackDataset,
    HandoffArtifact,
)
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

        sections = self._generate_sections(
            topic=request_model.topic,
            persona=request_model.persona,
            articles=selected_articles,
            mode_used=mode_used,
            warnings=warnings,
        )

        brief_id = f"brief-{uuid4().hex[:10]}"
        created_at = datetime.now(timezone.utc)
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
            articles=selected_articles,
            overview=sections.overview,
            key_takeaways=sections.key_takeaways,
            framing_comparison=sections.framing_comparison,
            uncertainties=sections.uncertainties,
            citations=citations,
            export_html_path=str(self.artifact_store.export_path(brief_id)),
            warnings=list(dict.fromkeys(warnings)),
        )
        handoff = HandoffArtifact(
            brief_id=brief_id,
            topic=request_model.topic,
            created_at=created_at,
            mode_used=mode_used,
            selected_source_ids=[article.id for article in selected_articles],
            sections={
                "overview": sections.overview,
                "key_takeaways": sections.key_takeaways,
                "framing_comparison": sections.framing_comparison,
                "uncertainties": sections.uncertainties,
            },
            warnings=response.warnings,
        )
        self.artifact_store.save(response, handoff)
        return response

    def load_brief_response(self, brief_id: str) -> BriefResponse:
        return self.artifact_store.load_brief(brief_id)

    def load_handoff(self, brief_id: str) -> HandoffArtifact:
        return self.artifact_store.load_handoff(brief_id)

    def get_export_path(self, brief_id: str) -> Path:
        return self.artifact_store.export_path(brief_id)

    def _prepare_live_articles(self, articles: Sequence[ArticleRecord], topic: str) -> List[ArticleRecord]:
        scored = score_articles(articles, topic=topic)
        deduplicated = deduplicate_articles(scored)
        return deduplicated[:5]

    def _prepare_fallback_articles(self, topic: str) -> List[ArticleRecord]:
        scored = score_articles(self.fallback_dataset.articles, topic=topic)
        return deduplicate_articles(scored)[:5]

    def _generate_sections(
        self,
        topic: str,
        persona: str,
        articles: Sequence[ArticleRecord],
        mode_used: str,
        warnings: List[str],
    ) -> BriefSections:
        try:
            return self.llm_client.generate_sections(topic=topic, persona=persona, articles=articles)
        except Exception as exc:
            if mode_used == "fallback":
                warnings.append("precomputed_sections_used")
                return self.fallback_dataset.precomputed_sections
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

