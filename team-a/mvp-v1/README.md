# Team A MVP v1

Local-first FastAPI app for the 项目管理 Team A MVP.

## What it does

- Takes a topic from a research-analyst persona
- Attempts live RSS retrieval through Google News
- Falls back to a curated demo dataset if live retrieval is weak or times out
- Ranks and deduplicates selected sources
- Generates a structured brief with citations
- Saves an HTML export plus a Team B handoff JSON artifact

## One-command local run

```bash
./run_local.sh
```

The app starts on `http://127.0.0.1:8000`.

## Environment variables

- `OPENAI_API_KEY`: required for live brief generation
- `OPENAI_BASE_URL`: optional override for OpenAI-compatible APIs
- `OPENAI_MODEL`: optional model name override

If the LLM call fails during fallback mode, the app serves the precomputed brief from the curated dataset so the demo can still finish.
