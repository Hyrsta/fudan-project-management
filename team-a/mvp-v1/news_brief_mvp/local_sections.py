from __future__ import annotations

from typing import Sequence

from .models import ArticleRecord, BriefSections


def build_heuristic_sections(topic: str, persona: str, articles: Sequence[ArticleRecord]) -> BriefSections:
    if not articles:
        raise ValueError("At least one article is required to build heuristic sections.")

    lead = articles[0]
    supporting = list(articles[1:4])
    source_names = _unique_sources(articles)
    source_phrase = _format_source_list(source_names[:3])
    lead_signal = _clean_sentence(lead.summary or lead.snippet or lead.title)

    overview = (
        f"For the topic '{topic}', the strongest current signal comes from {lead.source}, "
        f"with the selected coverage drawing on {len(articles)} sources including {source_phrase}. "
        f"The leading storyline is: {lead_signal}"
    )

    key_takeaways = []
    for article in articles[:3]:
        signal = _clean_sentence(article.summary or article.snippet or article.title)
        key_takeaways.append(f"{article.source} emphasizes that {signal}")

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

    uncertainties = [
        f"The brief is based on {len(articles)} selected articles, so coverage breadth is still limited.",
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
        framing_comparison=framing_comparison,
        uncertainties=uncertainties[:3],
    )


def _clean_sentence(text: str) -> str:
    cleaned = " ".join(text.strip().split())
    if not cleaned:
        return "coverage is still developing."
    if cleaned[-1] not in ".!?":
        cleaned += "."
    return cleaned[0].lower() + cleaned[1:] if cleaned and cleaned[0].isupper() else cleaned


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
    if persona == "executive_brief":
        return f"The strongest executive signal comes from a focused set of {article_count} ranked sources."
    if persona == "market_watch":
        return "The current coverage highlights the clearest business and market signals across the selected sources."
    if persona == "policy_intelligence":
        return "The current coverage highlights the clearest regulatory and geopolitical signals across the selected sources."
    return f"The current briefing is grounded in a focused but traceable set of {article_count} selected sources."


def _persona_uncertainty(persona: str) -> str:
    if persona == "executive_brief":
        return "Near-term implications are clearer than long-range strategic outcomes in the current coverage."
    if persona == "market_watch":
        return "Market reaction and business impact may shift as additional reporting and company signals emerge."
    if persona == "policy_intelligence":
        return "Policy direction and enforcement details may evolve as agencies and officials clarify next steps."
    return "Some important context may still be missing while the story continues to develop across sources."
