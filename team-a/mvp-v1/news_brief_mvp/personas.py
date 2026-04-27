from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class PersonaDefinition:
    value: str
    label: str
    icon: str
    short: str
    prompt_guidance: str
    focus: List[str]
    comparison_axes: List[str]
    section_titles: Dict[str, str]

    def as_option(self) -> Dict[str, object]:
        return {
            "value": self.value,
            "label": self.label,
            "icon": self.icon,
            "short": self.short,
            "focus": self.focus,
        }

    def as_metadata(self) -> Dict[str, object]:
        return {
            "value": self.value,
            "label": self.label,
            "focus": self.focus,
            "comparison_axes": self.comparison_axes,
        }


DEFAULT_PERSONA = "research_analyst"


PERSONAS: Dict[str, PersonaDefinition] = {
    "research_analyst": PersonaDefinition(
        value="research_analyst",
        label="Research analyst",
        icon="file-search",
        short="Evidence, framing, and uncertainty.",
        prompt_guidance="Balanced, structured, evidence-first, with clear source comparison.",
        focus=[
            "Evidence quality",
            "Source framing",
            "Uncertainty",
        ],
        comparison_axes=[
            "Overall angle",
            "Evidence strength",
            "Source framing",
            "Open questions",
        ],
        section_titles={
            "summary": "Executive summary",
            "facts": "Key facts",
            "comparison": "Coverage comparison",
            "takeaways": "Takeaways",
            "insights": "Signals",
            "watch": "Watch",
            "note": "Coverage note",
        },
    ),
    "financial_analyst": PersonaDefinition(
        value="financial_analyst",
        label="Financial analyst",
        icon="chart-line",
        short="Market impact and investor risk.",
        prompt_guidance="Emphasize market impact, company exposure, valuation sensitivity, catalysts, and investor risk.",
        focus=[
            "Market impact",
            "Company exposure",
            "Investor risk",
        ],
        comparison_axes=[
            "Market impact",
            "Revenue or cost exposure",
            "Investor sentiment",
            "Catalysts",
        ],
        section_titles={
            "summary": "Investment summary",
            "facts": "Market facts",
            "comparison": "Market framing",
            "takeaways": "Investor takeaways",
            "insights": "Market signals",
            "watch": "Risk watch",
            "note": "Source framing",
        },
    ),
    "executive_brief": PersonaDefinition(
        value="executive_brief",
        label="Executive brief",
        icon="briefcase-business",
        short="Decisions, urgency, and next moves.",
        prompt_guidance="Concise, high-signal, decision-oriented, with clear implications and next actions.",
        focus=[
            "Decision relevance",
            "Strategic impact",
            "Urgency",
        ],
        comparison_axes=[
            "Decision relevance",
            "Strategic impact",
            "Urgency",
            "Execution risk",
        ],
        section_titles={
            "summary": "Decision summary",
            "facts": "Decision facts",
            "comparison": "Executive framing",
            "takeaways": "Action points",
            "insights": "Strategic signals",
            "watch": "Decision risks",
            "note": "Briefing note",
        },
    ),
    "policy_intelligence": PersonaDefinition(
        value="policy_intelligence",
        label="Policy intelligence",
        icon="landmark",
        short="Regulation and geopolitical stakes.",
        prompt_guidance="Emphasize regulation, public policy, geopolitical implications, stakeholders, and implementation risk.",
        focus=[
            "Regulatory signal",
            "Government actors",
            "Implementation risk",
        ],
        comparison_axes=[
            "Regulatory signal",
            "Stakeholders",
            "Jurisdiction",
            "Implementation risk",
        ],
        section_titles={
            "summary": "Policy summary",
            "facts": "Policy facts",
            "comparison": "Policy framing",
            "takeaways": "Policy takeaways",
            "insights": "Regulatory signals",
            "watch": "Implementation risks",
            "note": "Policy note",
        },
    ),
    "academic_researcher": PersonaDefinition(
        value="academic_researcher",
        label="Academic researcher",
        icon="graduation-cap",
        short="Context, evidence quality, citations.",
        prompt_guidance="Emphasize background context, evidence quality, competing interpretations, and research gaps.",
        focus=[
            "Background context",
            "Evidence quality",
            "Research gaps",
        ],
        comparison_axes=[
            "Evidence strength",
            "Context depth",
            "Competing interpretations",
            "Research gap",
        ],
        section_titles={
            "summary": "Research summary",
            "facts": "Evidence points",
            "comparison": "Literature-style framing",
            "takeaways": "Research takeaways",
            "insights": "Interpretive signals",
            "watch": "Evidence limits",
            "note": "Research note",
        },
    ),
    "risk_analyst": PersonaDefinition(
        value="risk_analyst",
        label="Risk analyst",
        icon="shield-alert",
        short="Downside scenarios and weak signals.",
        prompt_guidance="Emphasize downside scenarios, likelihood, severity, early warnings, mitigations, and uncertainty.",
        focus=[
            "Downside scenarios",
            "Early warnings",
            "Mitigations",
        ],
        comparison_axes=[
            "Downside severity",
            "Likelihood",
            "Early warnings",
            "Mitigations",
        ],
        section_titles={
            "summary": "Risk summary",
            "facts": "Risk facts",
            "comparison": "Risk framing",
            "takeaways": "Risk takeaways",
            "insights": "Warning signals",
            "watch": "Risk watch",
            "note": "Risk note",
        },
    ),
    "market_watch": PersonaDefinition(
        value="market_watch",
        label="Market watch",
        icon="chart-candlestick",
        short="Business movement and competition.",
        prompt_guidance="Emphasize market impact, business implications, competitive movement, and pricing signals.",
        focus=[
            "Business impact",
            "Competitive movement",
            "Pricing signals",
        ],
        comparison_axes=[
            "Business impact",
            "Competitive movement",
            "Pricing signal",
            "Near-term catalyst",
        ],
        section_titles={
            "summary": "Market summary",
            "facts": "Market facts",
            "comparison": "Market framing",
            "takeaways": "Market takeaways",
            "insights": "Market signals",
            "watch": "Market watch",
            "note": "Market note",
        },
    ),
}


def get_persona_definition(value: str) -> PersonaDefinition:
    return PERSONAS.get(value, PERSONAS[DEFAULT_PERSONA])


def get_persona_options() -> List[Dict[str, object]]:
    ordered_keys = [
        "research_analyst",
        "financial_analyst",
        "executive_brief",
        "policy_intelligence",
        "academic_researcher",
        "risk_analyst",
    ]
    return [PERSONAS[key].as_option() for key in ordered_keys]
