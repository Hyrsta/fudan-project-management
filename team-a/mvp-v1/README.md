# Team A Final Product v1

Local-first FastAPI app for the Team A final product.

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
- Shows recent saved briefs in the React workspace for easier demos

## Tech stack

- Python 3
- FastAPI
- Uvicorn
- React 18
- Vite
- TypeScript
- Jinja2 templates for saved report views
- HTML/CSS/JavaScript static assets
- httpx
- feedparser
- Pydantic v2

## Project structure

```text
team-a/mvp-v1/
|-- README.md
|-- run_local.sh
|-- requirements.txt
|-- requirements-dev.txt
|-- pytest.ini
|-- frontend/
|   |-- package.json
|   |-- tsconfig.json
|   |-- vite.config.ts
|   `-- src/main.tsx
|-- news_brief_mvp/
|   |-- main.py
|   |-- service.py
|   |-- live_retriever.py
|   |-- ranking.py
|   |-- llm.py
|   |-- local_sections.py
|   |-- storage.py
|   |-- data/
|   |-- prompts/
|   |-- static/
|   |   |-- css/app.css
|   |   |-- js/app.js
|   |   `-- react/
|   `-- templates/
`-- tests/
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
- `NEWS_BRIEF_RBAC_ENABLED`: enables route-level RBAC when true; defaults to true
- `NEWS_BRIEF_RBAC_TOKENS`: optional `role:token` or `role=token` overrides for RBAC
- `NEWS_BRIEF_RBAC_HEADER`: optional API key header name, defaults to `X-API-Key`
- `NEWS_BRIEF_RBAC_COOKIE`: optional browser cookie name, defaults to `news_brief_api_key`

Example:

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_MODEL="gpt-4o-mini"
./run_local.sh
```

Default local demo RBAC tokens:

- `viewer-local-token`: read saved briefs and exports
- `analyst-local-token`: generate briefs and read exports
- `admin-local-token`: generate briefs, read exports, and open Team B handoff JSON

For a custom local setup:

```bash
export NEWS_BRIEF_RBAC_TOKENS="viewer:read-token;analyst:write-token;admin:admin-token"
```

Protected API clients can send the token with `X-API-Key`. The browser UI opens
with a login page, validates the selected demo token or custom API key, and then
stores the active access key in a local cookie so report links and downloads
continue to work from the local interface.

Copy `.env.example` if you want to keep local model settings in one place.

## Test run

```bash
pytest -q
```

## Frontend build

The primary browser UI is a React + TypeScript app under `frontend/src/` and is
built by Vite into `news_brief_mvp/static/react/`. FastAPI serves that built
bundle from `/`.

```bash
cd frontend
npm install
npm run build
```

The legacy static CSS/JS files remain for server-rendered saved report pages.

## Main app routes

- `GET /` - React app shell
- `GET /api/config` - frontend bootstrap config and persona options
- `GET /api/briefs/recent` - recent brief list for the React app; requires any role
- `POST /api/briefs` - create a brief; requires `analyst` or `admin`
- `GET /api/briefs/{brief_id}` - reopen a saved brief as JSON; requires any role
- `GET /briefs/{brief_id}` - reopen a saved brief as HTML; requires any role
- `GET /briefs/{brief_id}/export` - download the HTML export; requires any role
- `GET /briefs/{brief_id}/export.md` - download the Markdown report; requires any role
- `GET /briefs/{brief_id}/handoff` - open the Team B handoff JSON; requires `admin`
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

1. Trusted RSS / Google News retrieval + LLM sections
2. Live or fallback article set + deterministic local sections
3. Fallback dataset + precomputed sections

The selected path is surfaced through:

- `mode_used`
- `section_generation_mode`
- `warnings`

## More detailed docs

See:

- `docs/RUNBOOK.md` - local operation, troubleshooting, and demo guidance
