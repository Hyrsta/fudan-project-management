from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Iterable

import httpx

from .models import ArticleRecord, BriefSections


JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


class OpenAICompatibleLLMClient:
    def __init__(self, prompt_path: Path):
        self.prompt_path = prompt_path

    def generate_sections(self, topic: str, persona: str, articles: Iterable[ArticleRecord]) -> BriefSections:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set.")

        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        prompt_template = self.prompt_path.read_text().strip()
        article_lines = []
        for article in articles:
            article_lines.append(
                "\n".join(
                    [
                        f"ID: {article.id}",
                        f"Title: {article.title}",
                        f"Source: {article.source}",
                        f"Snippet: {article.summary or article.snippet}",
                        f"Published: {article.published_at.isoformat() if article.published_at else 'unknown'}",
                        f"URL: {article.url}",
                    ]
                )
            )

        prompt = prompt_template.format(
            topic=topic,
            persona=persona,
            articles="\n\n".join(article_lines),
        )

        response = httpx.post(
            f"{base_url}/chat/completions",
            timeout=30.0,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model_name,
                "temperature": 0.2,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a careful research briefing assistant. "
                            "Respond with valid JSON only."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
            },
        )
        response.raise_for_status()
        payload = response.json()
        content = payload["choices"][0]["message"]["content"]
        return BriefSections.model_validate(_extract_json_object(content))


def _extract_json_object(content: str):
    match = JSON_BLOCK_RE.search(content)
    if not match:
        raise RuntimeError("LLM response did not include a JSON object.")
    return json.loads(match.group(0))

