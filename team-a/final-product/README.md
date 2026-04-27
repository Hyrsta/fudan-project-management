# Team A Final Product v1

## Product summary

Team A's final product is a local-first news intelligence web app. A user enters a topic, and the app produces a source-aware research report with ranked articles, key facts, comparison, insights, risk notes, source evidence, and exportable artifacts.

The final version upgrades the earlier MVP from a simple analyst brief generator into a clearer product deliverable for the course. It keeps the same local laptop demo path, but now presents the workflow as a modular research assistant rather than a one-step summary tool.

## What changed from MVP

- Multi-source retrieval through trusted direct RSS feeds, with Google News RSS as fallback.
- Structured report sections: executive summary, key takeaways, key facts, coverage comparison, insights, and risk notes.
- Source evidence table showing why each article was selected.
- Hybrid generation: LLM output when configured, deterministic local report generation when no API key is available.
- Saved report manifest for recent briefings.
- HTML, Markdown, and JSON handoff exports.

## Demo path

1. Open `team-a/mvp-v1/`.
2. Run `./run_local.sh`.
3. Open `http://127.0.0.1:8000`.
4. Generate a report for `AI chip export controls`.
5. Show the source evidence panel, recent report library, HTML export, Markdown export, and Team B JSON handoff.

## Course positioning

This product supports the business-plan promise: turning fragmented news coverage into traceable intelligence. It demonstrates the six-agent workflow in a compact local implementation:

- Collector: trusted RSS and Google News retrieval.
- Filter/Rank: source credibility, freshness, topic fit, and duplicate removal.
- Summarizer: LLM or deterministic local report generation.
- Comparison: outlet framing comparison.
- Insight: trends, signals, and points to watch.
- Report: HTML, Markdown, and JSON handoff artifacts.

