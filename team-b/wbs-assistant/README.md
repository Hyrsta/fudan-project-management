# WBS Decomposition Assistant

**Team B — Project Management & AI Agent Team**  
Course: Advanced Project Management: Value-Driven & AI-Enabled | Fudan University 2026

---

## What This Is

The WBS Decomposition Assistant is a multi-agent workflow built on **Dify** that automatically converts product feature descriptions into structured user stories and a Work Breakdown Structure (WBS) with sprint planning.

It is part of Team B's AI-powered project management system, which manages Team A's development of an AI-powered news research and analysis platform.

---

## How It Works

The workflow runs two AI agents in sequence:

```
User Input (feature list)
        ↓
Requirements Agent
→ Converts features into structured user stories
→ Assigns priority (High/Medium/Low) and complexity (Simple/Medium/Complex)
→ Generates acceptance criteria for each story
        ↓
Scheduling Agent
→ Breaks each user story into concrete development tasks (WBS)
→ Estimates hours per task
→ Assigns tasks across sprints based on team capacity (40 person-hours/week)
→ Flags capacity risks and deferred items
        ↓
Output (WBS + Sprint Plan)
```

---

## Sample Input

Paste a feature list like this when running the workflow:

```
1. Collector Agent - retrieves articles from news sources by topic
2. Filter/Rank Agent - removes duplicates and scores source credibility
3. Summarizer Agent - converts long articles into short summaries
4. Comparison Agent - compares how different outlets cover the same story
5. Insight Agent - identifies trends and recurring themes
6. Report Agent - combines all outputs into a final news brief
```

---

## Sample Output

**Requirements Agent produces:**
- 6 structured user stories in "As a [user], I want [feature] so that [benefit]" format
- 3-5 acceptance criteria per story
- Priority and complexity ratings
- Summary table

**Scheduling Agent produces:**
- Full WBS breakdown with task IDs and hour estimates
- 5-sprint plan mapped to Weeks 6-10
- Capacity utilization per sprint (max 40 person-hours/week)
- List of deferred items that exceed the 5-week timeline

---

## How to Run This in Dify

1. Go to [dify.ai](https://dify.ai) and log in
2. Navigate to **Studio** → **Create App** → **Workflow** → **Import DSL**
3. Upload the `.yml` DSL file from this folder
4. Set your default model to **claude-sonnet-4-20250514** (Anthropic) or any Claude model
5. Click **Test Run**, paste in your feature list, and hit Run
6. Results appear in the Output panel — user stories first, then WBS and sprint plan

---

## Files in This Folder

| File | Description |
|------|-------------|
| `wbs_decomposition_assistant.yml` | Dify DSL export — import this to run the workflow |
| `workflow_canvas.png` | Screenshot of the full agent pipeline in Dify |
| `test_run_success.png` | Screenshot of a successful test run |

---

## Agent Details

### Requirements Agent
- **Model:** Claude Sonnet 4
- **Input:** Product feature list (plain text)
- **Output:** Structured user stories with acceptance criteria, priority, and complexity
- **PMBOK Alignment:** Scope Performance Domain — requirements collection, scope definition

### Scheduling Agent
- **Model:** Claude Sonnet 4
- **Input:** User stories from Requirements Agent
- **Output:** WBS task breakdown, sprint plan, capacity analysis
- **PMBOK Alignment:** Schedule Performance Domain — activity sequencing, duration estimation

---

## Part of the Larger System

This assistant is the Week 6 prototype of Team B's full 4-agent project management system:

| Agent | Status | Due |
|-------|--------|-----|
| Requirements Agent | ✅ Complete | Week 6 |
| Scheduling Agent | ✅ Complete | Week 6 |
| Risk Warning Agent | ✅ Complete (early) | Week 9 |
| Report Agent | 🔄 In progress | Week 10 |

The full system will include a live project dashboard displaying burndown charts, risk registers, and weekly status reports — all generated automatically by the agent pipeline.

---

## Built With

- [Dify](https://dify.ai) — visual multi-agent workflow platform
- [Claude Sonnet 4](https://anthropic.com) — underlying LLM for all agents
- PMBOK 8th Edition — framework for agent design and PM alignment
