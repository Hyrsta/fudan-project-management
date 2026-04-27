# Final Product Demo Script

## 1. Opening

This is Team A's news intelligence final product. The user enters a topic, and the system returns a structured report with traceable sources instead of a black-box AI answer.

## 2. Generate a report

Use this topic:

```text
AI chip export controls
```

Explain the workflow:

- The app checks trusted RSS sources first.
- It falls back to Google News RSS and the curated dataset when live coverage is weak.
- It ranks articles by source credibility, freshness, and topic fit.
- It generates a report using an LLM if configured, or a local deterministic builder if no key is available.

## 3. Show the report

Point out these sections:

- Executive Summary
- Key Takeaways
- Key Facts
- Coverage Comparison
- Insights and Signals
- Points to Watch
- Selected Sources
- Why These Sources

## 4. Show exports

Open:

- HTML export for readable sharing.
- Markdown export for course reports and editing.
- JSON handoff for Team B integration.

## 5. Closing line

The product value is not simply summarization. It is source-aware research: the user can see what was selected, why it was selected, how sources frame the story, and what uncertainty remains.

