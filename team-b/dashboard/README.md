# F.R.I.D.A.Y — Project Intelligence Dashboard

**Forecast · Risk · Intelligence · Dashboard · Analysis · Yield**

Team B's AI-powered project management dashboard for the AI-Powered News Research & Analysis Platform (Team A's product).

---

## What This Is

F.R.I.D.A.Y is a live project intelligence dashboard that calls Team B's 4-agent Dify pipeline and renders the outputs in a premium, Bloomberg-style interface. It gives the project manager a real-time view of:

- Requirements and user story backlog
- Sprint plan and WBS breakdown
- Risk register with overall project health rating
- Weekly status report synthesized from all agents

---

## Current Status

| Feature | Status |
|---------|--------|
| Dashboard UI | ✅ Complete |
| Flask backend server | ✅ Complete |
| Requirements Agent output rendering | ✅ Complete |
| Scheduling Agent output rendering | ✅ Complete |
| Risk Agent output rendering | ✅ Complete |
| Report Agent output rendering | ✅ Complete |
| Live Dify API integration | 🔄 Model timeout issue being resolved |
| Overview cards population | 🔄 Depends on live API fix |

**Known issue:** The 4-agent pipeline times out when running sequentially on some model configurations. Currently testing model options to find the fastest reliable combination.

---

## Setup Instructions

### Prerequisites
- Python 3.x installed
- A Dify API key (Dify workflow → API Access in left sidebar → copy the `app-...` key)
- The Dify workflow published and running

### Step 1 — Get the files

Clone the repo or download the `team-b/dashboard` folder:

```bash
git clone https://github.com/Hyrsta/fudan-project-management
cd fudan-project-management/team-b/dashboard
```

### Step 2 — Create a virtual environment

```bash
python -m venv friday-env
```

Activate it:

**Windows:**
```bash
friday-env\Scripts\activate
```

**Mac/Linux:**
```bash
source friday-env/bin/activate
```

### Step 3 — Install dependencies

```bash
pip install flask flask-cors requests
```

### Step 4 — Start the server

```bash
python server.py
```

You should see:
```
==================================================
  F.R.I.D.A.Y — Project Intelligence System
  Starting server on http://localhost:5000
==================================================
```

### Step 5 — Open the dashboard

Go to `http://localhost:5000` in your browser.

### Step 6 — Run the pipeline

1. Click **Execute** in the left sidebar
2. Paste your Dify API key in the API Key field
3. The feature list is pre-loaded — or replace it with Team A's latest progress update
4. Click **Execute All Agents**
5. Navigate the tabs to see the intelligence output

---

## File Structure

```
dashboard/
├── FRIDAY_v3.html       # Main dashboard frontend
├── server.py            # Flask backend (proxies Dify API calls)
└── README.md            # This file
```

---

## How It Works

```
Browser (FRIDAY_v3.html)
        ↓  POST /api/run
Flask Server (server.py)
        ↓  POST https://api.dify.ai/v1/workflows/run
Dify Workflow (4-agent pipeline)
        ↓  Returns outputs
Flask Server
        ↓  JSON response
Browser → renders tabs
```

The Flask server acts as a proxy to avoid CORS issues when calling the Dify API directly from the browser.

---

## What Needs to Be Done

### Immediate fix needed
The main outstanding issue is the model timeout. When all 4 agents run sequentially, the pipeline sometimes exceeds Dify's response time limit. 

**To fix:** In Dify, set all 4 LLM nodes to the fastest available model (currently testing `claude-haiku-4-5-20251001`). Make sure to click **Publish** after changing models.

### Remaining features
- Connect the dashboard to Team A's weekly progress updates (replace feature list input with a progress update template)
- Add a weekly history log showing past runs
- Polish the overview cards risk list and feature matrix once live data flows through

---

## Connecting to Team A's Progress Updates

Each week after the joint sync meeting, paste Team A's progress update into the feature list input instead of the default feature list. For example:

```
Week 7 Progress Update:
- Collector Agent: Complete. NewsAPI and Guardian API integrated.
- Filter/Rank Agent: 3 days behind. Duplicate detection algorithm more complex than estimated.
- Summarizer Agent: Starting this week.
- Blocker: NewsAPI rate limit hit during testing, need backup source.
```

The Risk Agent will automatically identify risks from this update and the Report Agent will generate a weekly status report.

---

## Built With

- [Dify](https://dify.ai) — multi-agent workflow platform
- [Flask](https://flask.palletsprojects.com) — Python backend server
- Claude / Gemini — underlying LLM for all agents
- Vanilla HTML/CSS/JS — frontend dashboard

---

*Team B — Project Management & AI Agent Team | Fudan University 2026*
