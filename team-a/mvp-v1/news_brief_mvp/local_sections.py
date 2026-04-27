from __future__ import annotations

import html
from typing import Sequence

from .models import ArticleRecord, BriefSections
from .personas import get_persona_definition


def build_heuristic_sections(
    topic: str,
    persona: str,
    articles: Sequence[ArticleRecord],
    goal: str = "",
) -> BriefSections:
    if not articles:
        raise ValueError("At least one article is required to build heuristic sections.")

    persona_definition = get_persona_definition(persona)
    lead = articles[0]
    supporting = list(articles[1:4])
    source_names = _unique_sources(articles)
    source_phrase = _format_source_list(source_names[:3])
    lead_signal = _clean_sentence(lead.summary or lead.snippet or lead.title)
    goal_sentence = f" The stated research goal is to {_lower_first(goal.rstrip('.'))}." if goal else ""

    overview = (
        f"For the topic '{topic}', using a {persona_definition.label.lower()} lens, the strongest current signal comes from {lead.source}, "
        f"with the selected coverage drawing on {len(articles)} sources including {source_phrase}. "
        f"The leading storyline is: {lead_signal}{goal_sentence}"
    )

    key_takeaways = []
    key_facts = []
    for article in articles[:3]:
        signal = _clean_sentence(article.summary or article.snippet or article.title)
        key_takeaways.append(f"{article.source} emphasizes that {signal}")
        key_facts.append(f"{article.source}: {signal}")

    if len(key_takeaways) < 3:
        key_takeaways.append(_persona_takeaway(persona, len(articles)))
    if len(key_takeaways) < 4:
        key_takeaways.append(
            f"Source ranking favors credibility, recency, and topic overlap instead of raw article volume."
        )

    framing_parts = []
    framing_parts.append(
        f"{lead.source} sets the lead frame around {lead_signal.lower()}"
    )
    for article in supporting[:2]:
        framing_parts.append(
            f"{article.source} adds emphasis on {_clean_sentence(article.summary or article.snippet or article.title).lower()}"
        )
    framing_comparison = "; ".join(framing_parts) + "."

    insights = [
        f"The highest-confidence source signal is from {lead.source}, supported by {len(articles) - 1} additional selected articles.",
        f"The strongest value is the traceable comparison across {len(source_names)} visible sources, not a single blended summary.",
    ]
    if persona in {"financial_analyst", "market_watch"}:
        insights.append("Financial readers should watch market reaction, company exposure, investor sentiment, and near-term catalysts.")
    elif persona == "executive_brief":
        insights.append("Executives should use this as a quick decision filter, then inspect the cited sources before committing resources.")
    elif persona == "academic_researcher":
        insights.append("Research readers should treat this as a source map and verify whether the strongest claims are independently repeated.")
    elif persona == "risk_analyst":
        insights.append("Risk readers should watch for downside scenarios, weak signals, and evidence that changes likelihood or severity.")
    elif persona == "policy_intelligence":
        insights.append("Policy readers should watch implementation timing, enforcement scope, and cross-border responses.")
    else:
        insights.append("Use this report as a focused starting point and inspect the cited sources before decisions.")

    if persona == "market_watch":
        insights.append("Market-facing readers should watch whether policy signals translate into pricing, supply-chain, or competitive movement.")

    uncertainties = [
        f"The report is based on {len(articles)} selected articles, so coverage breadth is still limited.",
        _persona_uncertainty(persona),
    ]
    if len(source_names) < 3:
        uncertainties.append(
            "Source diversity is limited in this run, so framing differences may be underrepresented."
        )
    else:
        uncertainties.append(
            "The selected sources do not capture every regional or partisan framing of the topic."
        )

    return BriefSections(
        overview=overview,
        key_takeaways=key_takeaways[:4],
        key_facts=key_facts[:4],
        framing_comparison=framing_comparison,
        insights=insights[:3],
        uncertainties=uncertainties[:3],
        risk_notes=uncertainties[:3],
    )


def _clean_sentence(text: str) -> str:
    cleaned = " ".join(html.unescape(text).strip().split())
    if not cleaned:
        return "coverage is still developing."
    if cleaned[-1] not in ".!?":
        cleaned += "."
    if len(cleaned) > 1 and cleaned[:2].isupper():
        return cleaned
    return cleaned[0].lower() + cleaned[1:] if cleaned and cleaned[0].isupper() else cleaned


def _lower_first(text: str) -> str:
    return text[:1].lower() + text[1:] if text else text


def _unique_sources(articles: Sequence[ArticleRecord]) -> list[str]:
    seen = set()
    ordered = []
    for article in articles:
        source = article.source.strip()
        key = source.lower()
        if key in seen or not source:
            continue
        seen.add(key)
        ordered.append(source)
    return ordered


def _format_source_list(sources: Sequence[str]) -> str:
    if not sources:
        return "the available sources"
    if len(sources) == 1:
        return sources[0]
    if len(sources) == 2:
        return f"{sources[0]} and {sources[1]}"
    return ", ".join(sources[:-1]) + f", and {sources[-1]}"


def _persona_takeaway(persona: str, article_count: int) -> str:
    if persona == "financial_analyst":
        return "The strongest financial signal comes from market impact, company exposure, and investor-risk clues in the selected sources."
    if persona == "executive_brief":
        return f"The strongest executive signal comes from a focused set of {article_count} ranked sources."
    if persona == "market_watch":
        return "The current coverage highlights the clearest business and market signals across the selected sources."
    if persona == "policy_intelligence":
        return "The current coverage highlights the clearest regulatory and geopolitical signals across the selected sources."
    if persona == "academic_researcher":
        return "The current coverage should be treated as an evidence map, not a complete research literature review."
    if persona == "risk_analyst":
        return "The current coverage highlights downside scenarios, uncertainty, and weak signals that deserve monitoring."
    return f"The current briefing is grounded in a focused but traceable set of {article_count} selected sources."


def _persona_uncertainty(persona: str) -> str:
    if persona == "financial_analyst":
        return "Investor implications may shift quickly as companies, regulators, and markets respond to new details."
    if persona == "executive_brief":
        return "Near-term implications are clearer than long-range strategic outcomes in the current coverage."
    if persona == "market_watch":
        return "Market reaction and business impact may shift as additional reporting and company signals emerge."
    if persona == "policy_intelligence":
        return "Policy direction and enforcement details may evolve as agencies and officials clarify next steps."
    if persona == "academic_researcher":
        return "The available articles may not include primary documents, datasets, or peer-reviewed evidence."
    if persona == "risk_analyst":
        return "Risk likelihood and severity may change as new evidence confirms or weakens early signals."
    return "Some important context may still be missing while the story continues to develop across sources."
