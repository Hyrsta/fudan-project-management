# Team B Handoff Guide

## Handoff endpoint

Each generated report exposes a JSON handoff artifact:

```text
GET /briefs/{brief_id}/handoff
```

## Handoff content

The JSON includes:

- `brief_id`
- `topic`
- `created_at`
- `mode_used`
- `section_generation_mode`
- `selected_source_ids`
- structured report `sections`
- `source_evidence`
- `pipeline_metadata`
- `quality_notes`
- `export_paths`
- `warnings`

## How Team B can use it

- WBS assistant: break the report workflow into project tasks.
- Risk warning agent: inspect `warnings`, `quality_notes`, and `source_evidence`.
- Stakeholder simulation: use the comparison and risk-note sections to simulate user concerns.
- AI system v2.0 integration: treat this JSON as Team A's report-generation output contract.

