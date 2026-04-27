# Evaluation Notes

## Success criteria

- A report can be generated locally without an API key.
- Every report includes source links and a source-evidence explanation.
- The app produces HTML, Markdown, and JSON artifacts.
- Recent reports can be reopened from the homepage.
- Tests pass with `python -m pytest -q`.

## Quality dimensions

| Dimension | How this version addresses it |
| --- | --- |
| Retrieval coverage | Direct trusted RSS feeds plus Google News fallback and curated fallback dataset. |
| Citation completeness | Every selected article is preserved with title, source, URL, and ranking metadata. |
| Factual grounding | Local and LLM reports are built from selected article records only. |
| Comparative usefulness | The report includes a coverage-comparison section and source evidence notes. |
| Reliability | The product works in no-key mode and records generation mode in artifacts. |

## Known limits

- Direct RSS feeds return different coverage depending on the topic and time.
- The local deterministic report is reliable for demos, but less nuanced than a good LLM response.
- The product does not yet include user accounts, cloud deployment, scheduled digests, or long-term personalization.

