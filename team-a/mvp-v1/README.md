# Team A MVP v1

Local-first FastAPI app for the 项目管理 Team A MVP.

## What it does

- Takes a topic from a research-analyst persona
- Attempts live RSS retrieval through Google News
- Falls back to a curated demo dataset if live retrieval is weak or times out
- Ranks and deduplicates selected sources
- Generates a structured brief with citations
- Falls back to a local heuristic section builder if the LLM is unavailable
- Saves an HTML export plus a Team B handoff JSON artifact
- Shows recent saved briefs on the homepage for easier demos

## One-command local run

```bash
./run_local.sh
```

The app starts on `http://127.0.0.1:8000`.

## Environment variables

- `OPENAI_API_KEY`: optional, but recommended for model-written briefs
- `OPENAI_BASE_URL`: optional override for OpenAI-compatible APIs
- `OPENAI_MODEL`: optional model name override

If the LLM call fails, the app now attempts a local heuristic section builder before falling back to the precomputed demo brief. This keeps the demo usable even when model access is missing.

## Test run

```bash
pytest -q
```
