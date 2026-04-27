# Team A Final Product v1

Local-first FastAPI app for the 项目管理 Team A final product.

## Overview

This app generates a source-aware news intelligence report from a single topic
query. It is designed for a strong local course demo: the app tries trusted RSS
retrieval first, uses Google News RSS as fallback, and still produces a polished
deterministic report when model access is unavailable.

## What the app does

- Accepts a topic from a research-analyst persona
- Attempts direct trusted RSS retrieval plus Google News RSS fallback
- Falls back to a curated demo dataset if live retrieval is weak or times out
- Scores and deduplicates the candidate sources
- Generates brief sections with an OpenAI-compatible model when available
- Falls back to a local heuristic section builder if the LLM is unavailable
- Produces executive summary, key facts, source comparison, insights, and risk notes
- Saves local artifacts for the generated report and Team B handoff
- Shows recent saved briefs on the homepage for easier demos

## Tech stack

- Python 3
- FastAPI
- Uvicorn
- Jinja2 templates
- HTMX
- httpx
- feedparser
- Pydantic v2

## Project structure

```text
team-a/mvp-v1/
├── README.md
├── run_local.sh
├── requirements.txt
├── requirements-dev.txt
├── pytest.ini
├── news_brief_mvp/
│   ├── main.py
│   ├── service.py
│   ├── live_retriever.py
│   ├── ranking.py
│   ├── llm.py
│   ├── local_sections.py
│   ├── storage.py
│   ├── data/
│   ├── prompts/
│   └── templates/
└── tests/
```

## Quick start

From `team-a/mvp-v1/`:

```bash
./run_local.sh
```

The app starts on:

- <http://127.0.0.1:8000>

## Manual startup

From `team-a/mvp-v1/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
python -m news_brief_mvp
```

Alternative launch command:

```bash
uvicorn news_brief_mvp.main:app --host 127.0.0.1 --port 8000 --reload
```

## Environment variables

- `OPENAI_API_KEY`: optional, but recommended for model-written briefs
- `OPENAI_BASE_URL`: optional override for OpenAI-compatible APIs
- `OPENAI_MODEL`: optional model name override

Example:

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_MODEL="gpt-4o-mini"
./run_local.sh
```

Copy `.env.example` if you want to keep local model settings in one place.

## Test run

```bash
pytest -q
```

## Main app routes

- `GET /` - homepage and recent briefs
- `POST /api/briefs` - create a brief
- `GET /briefs/{brief_id}` - reopen a saved brief
- `GET /briefs/{brief_id}/export` - download the HTML export
- `GET /briefs/{brief_id}/export.md` - download the Markdown report
- `GET /briefs/{brief_id}/handoff` - open the Team B handoff JSON
- `GET /health` - simple health check

## Output artifacts

Generated artifacts are saved under:

```text
team-a/mvp-v1/artifacts/<brief_id>/
```

Each brief directory contains:

- `brief.json`
- `handoff.json`
- `brief.html`
- `brief.md`

The artifact root also contains:

- `manifest.json` - recent-report index used by the homepage

## Fallback behavior

The app is intentionally resilient in this order:

1. **Trusted RSS / Google News retrieval + LLM sections**
2. **Live or fallback article set + deterministic local sections**
3. **Fallback dataset + precomputed sections**

The selected path is surfaced through:

- `mode_used`
- `section_generation_mode`
- `warnings`

## More detailed docs

See:

- `docs/RUNBOOK.md` - local operation, troubleshooting, and demo guidance
