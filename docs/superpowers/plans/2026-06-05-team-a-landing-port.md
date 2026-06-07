# Team A landing site port: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the four-page editorial landing site (Home / Product / Access / About) from `项目管理/Website UIUX/` into the team-a Vite + React + TypeScript app, replacing the old `MarketingHomePage` and `PricingPage`.

**Architecture:** Faithful port (Approach A). Four route-mapped page components share editorial chrome (Masthead, Nav, Footer, SectionHead) and two mocks (BriefMock, AppMock) under `frontend/src/components/marketing/`. Design system tokens and classes ride under a `.a-root` CSS scope in the existing `styles.css`. Demo data lives in a typed `marketingData.ts`. i18n keys merge into the existing `i18n.ts`. FastAPI gets three new route decorators on `index()`; `/pricing` is removed.

**Tech Stack:** TypeScript, React 18, Vite, FastAPI, pytest, Google Fonts (Source Serif 4 + IBM Plex Sans/Mono + Instrument Serif). Reference source: `/Users/hyrsta/.openclaw/workspaces/course-projects/项目管理/Website UIUX/`.

**Spec:** `docs/superpowers/specs/2026-06-05-team-a-landing-design.md`.

**Working directory for all `cd` commands:** `team-a/mvp-v1/` unless otherwise stated.

---

## Task 1: Add Google Fonts to `frontend/index.html`

**Files:**
- Modify: `team-a/mvp-v1/frontend/index.html`

- [ ] **Step 1: Replace the `<head>` block to add Google Fonts.**

Replace the existing `<head>` contents with:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#f4efe4" />
  <title>News Intelligence Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,500;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
    rel="stylesheet"
  />
</head>
```

---

## Task 2: Add backend route test (TDD)

**Files:**
- Create: `team-a/mvp-v1/tests/test_marketing_routes.py`

- [ ] **Step 1: Write the failing test.**

```python
from fastapi.testclient import TestClient

from news_brief_mvp.main import create_app


def _client():
    return TestClient(create_app())


def test_root_serves_react_shell():
    response = _client().get("/")
    assert response.status_code == 200
    assert "<div id=\"root\"></div>" in response.text


def test_product_route_serves_react_shell():
    response = _client().get("/product")
    assert response.status_code == 200
    assert "<div id=\"root\"></div>" in response.text


def test_access_route_serves_react_shell():
    response = _client().get("/access")
    assert response.status_code == 200
    assert "<div id=\"root\"></div>" in response.text


def test_about_route_serves_react_shell():
    response = _client().get("/about")
    assert response.status_code == 200
    assert "<div id=\"root\"></div>" in response.text


def test_pricing_route_is_removed():
    response = _client().get("/pricing")
    assert response.status_code == 404
```

- [ ] **Step 2: Run the test, expect failures on the new routes and on `/pricing` (still 200).**

```bash
cd team-a/mvp-v1 && .venv/bin/pytest tests/test_marketing_routes.py -v
```

Expected: `test_root_serves_react_shell` PASS; `test_product_route_serves_react_shell`, `test_access_route_serves_react_shell`, `test_about_route_serves_react_shell` FAIL (404 from FastAPI); `test_pricing_route_is_removed` FAIL (still 200).

---

## Task 3: Add product/access/about routes; remove /pricing

**Files:**
- Modify: `team-a/mvp-v1/news_brief_mvp/main.py` (lines 56–60)

- [ ] **Step 1: Replace the decorator stack on `index()`.**

Replace:

```python
    @app.get("/", response_class=HTMLResponse)
    @app.get("/login", response_class=HTMLResponse)
    @app.get("/workspace", response_class=HTMLResponse)
    @app.get("/pricing", response_class=HTMLResponse)
    def index(request: Request):
```

With:

```python
    @app.get("/", response_class=HTMLResponse)
    @app.get("/login", response_class=HTMLResponse)
    @app.get("/workspace", response_class=HTMLResponse)
    @app.get("/product", response_class=HTMLResponse)
    @app.get("/access", response_class=HTMLResponse)
    @app.get("/about", response_class=HTMLResponse)
    def index(request: Request):
```

- [ ] **Step 2: Run the marketing route test again, expect all PASS.**

```bash
cd team-a/mvp-v1 && .venv/bin/pytest tests/test_marketing_routes.py -v
```

Expected: 5 passed.

- [ ] **Step 3: Run the full backend test suite to confirm no regressions.**

```bash
cd team-a/mvp-v1 && .venv/bin/pytest -q
```

Expected: no failures introduced by the route change.

---

## Task 4: Append the `.a-root` editorial CSS to `styles.css`

**Files:**
- Modify: `team-a/mvp-v1/frontend/src/styles.css` (append at end of file)

- [ ] **Step 1: Append the editorial design system to the end of `styles.css`.**

Port the contents of `Website UIUX/prod/chrome.jsx` lines 8–149 (the template-literal CSS) verbatim, with one wrapper change: every selector inside that block already starts with `.a-root` or `.a-root *`, so no rewriting is needed; just paste the rules into `styles.css` between sentinel comments:

```css

/* =========================================================================
 * Editorial marketing system (.a-root scope)
 * Ported from 项目管理/Website UIUX/prod/chrome.jsx.
 * Scoped under .a-root so it cannot leak into the workspace, login, or
 * saved-brief templates.
 * ========================================================================= */

.a-root {
  --ab-ink: #1a1916;
  --ab-ink-soft: color-mix(in oklab, #1a1916 66%, transparent);
  --ab-ink-mute: color-mix(in oklab, #1a1916 44%, transparent);
  --ab-rule: color-mix(in oklab, #1a1916 14%, transparent);
  --ab-rule-soft: color-mix(in oklab, #1a1916 8%, transparent);
  --ab-paper: #f6f3ec;
  --ab-paper-2: color-mix(in oklab, #f6f3ec 88%, #1a1916);
  --ab-accent: #b8442e;
  --ab-accent-ink: #fff;
  --ab-green: #116149;
  --ab-green-soft: #dceee2;
  --ab-green-deep: #0d523d;
  --ab-font-display: "Source Serif 4", "Newsreader", Georgia, serif;
  --ab-font-body: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --ab-font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --ab-font-italic: "Instrument Serif", "Source Serif 4", serif;
  font-family: var(--ab-font-body);
  color: var(--ab-ink);
  background: var(--ab-paper);
  font-size: 16px;
  line-height: 1.5;
  min-height: 100vh;
}
/* … the rest of chrome.jsx lines 34–149 verbatim … */
```

The full content for this block is in `Website UIUX/prod/chrome.jsx` lines 8–150 (the `s.textContent = \`…\`` template). Copy/paste those rules; they are already scoped under `.a-root`.

---

## Task 5: Add marketing types to `types.ts`

**Files:**
- Modify: `team-a/mvp-v1/frontend/src/types.ts` (append at end)

- [ ] **Step 1: Append marketing-side interfaces.**

Append at the bottom of `types.ts`:

```ts
export type PipelineAgent = {
  n: string;
  name: string;
  blurb: string;
};

export type PersonaLensId =
  | "research_analyst"
  | "financial_analyst"
  | "executive_brief"
  | "policy_intelligence"
  | "academic_researcher"
  | "risk_analyst";

export type PersonaLens = {
  value: PersonaLensId;
  label: string;
  short: string;
  focus: string[];
};

export type RankingSignal = {
  key: "c" | "f" | "t";
  label: string;
  w: number;
  blurb: string;
};

export type CoverageModeValue = "auto" | "live" | "fallback";

export type CoverageModeSpec = {
  value: CoverageModeValue;
  label: string;
  flow: string;
  blurb: string;
};

export type RoleSpec = {
  value: "viewer" | "analyst" | "admin";
  label: string;
  token: string;
  blurb: string;
  perms: string[];
};

export type DemoSourceEvidence = {
  n: string;
  id: string;
  src: string;
  url: string;
  cls: string;
  cred: number;
  fresh: number;
  fit: number;
  total: number;
  why: string;
  title: string;
  when: string;
};

export type DemoConfidence = {
  score: number;
  level: string;
  source_diversity: string;
  freshness: string;
  topic_fit: string;
  rationale: string[];
};

export type DemoBrief = {
  brief_id: string;
  topic: string;
  persona: PersonaLensId;
  persona_label: string;
  goal: string;
  mode_used: "live" | "fallback";
  section_generation_mode: string;
  warnings: string[];
  created_at: string;
  confidence: DemoConfidence;
  executive_summary: string;
  key_takeaways: string[];
  key_facts: string[];
  framing_comparison: string;
  insights: string[];
  uncertainties: string[];
  source_evidence: DemoSourceEvidence[];
};
```

---

## Task 6: Create `marketingData.ts`

**Files:**
- Create: `team-a/mvp-v1/frontend/src/marketingData.ts`

- [ ] **Step 1: Port `Website UIUX/prod/data.js` to typed TS.**

The source file is `Website UIUX/prod/data.js`. Port everything between `window.STUDIO = window.STUDIO || {};` and the closing of the file, dropping `window.STUDIO.` prefixes and replacing them with `export const`. Skip `STUDIO.HISTORY` (the marketing pages don't render it). Skip `STUDIO.AUTH` (unused). Keep `STUDIO.PRODUCT`, `STUDIO.PERSONAS`, `STUDIO.PIPELINE`, `STUDIO.SIGNALS`, `STUDIO.COVERAGE_MODES`, `STUDIO.EXPORTS`, `STUDIO.ROLES`, `STUDIO.DEMO_BRIEF`.

Header comment:

```ts
// marketingData.ts: typed constants for the public marketing site.
// Ported verbatim from 项目管理/Website UIUX/prod/data.js — every value
// traces to team-a/mvp-v1 source (ranking.py, personas.py, auth.py,
// data/source_registry.json, artifacts/brief-a017839f67/brief.json).
// Update DEMO_BRIEF if artifacts/brief-a017839f67/brief.json changes.

import type {
  CoverageModeSpec,
  DemoBrief,
  PersonaLens,
  PipelineAgent,
  RankingSignal,
  RoleSpec,
} from "./types";
```

Then:

```ts
export const PRODUCT = {
  name: "News Intelligence Studio",
  tagline: "A local-first analyst workspace for source-ranked, persona-aware briefings.",
  edition: "Team A MVP",
  endpoint: "studio.localhost",
} as const;

export const PERSONAS: PersonaLens[] = [ /* 6 entries from data.js STUDIO.PERSONAS */ ];

export const PIPELINE: PipelineAgent[] = [ /* 6 entries from data.js STUDIO.PIPELINE */ ];

export const SIGNALS: RankingSignal[] = [ /* 3 entries from data.js STUDIO.SIGNALS */ ];

export const COVERAGE_MODES: CoverageModeSpec[] = [ /* 3 entries from data.js STUDIO.COVERAGE_MODES */ ];

export const ROLES: RoleSpec[] = [ /* 3 entries from data.js STUDIO.ROLES */ ];

export const DEMO_BRIEF: DemoBrief = { /* verbatim STUDIO.DEMO_BRIEF */ };
```

Fill each array/object body from `Website UIUX/prod/data.js` exactly; preserve every string including unicode escapes (`→`, etc.) — TS handles them the same way JS does.

---

## Task 7: Merge marketing i18n keys into `i18n.ts`

**Files:**
- Modify: `team-a/mvp-v1/frontend/src/i18n.ts`

The English dict is `english` (around line 7); the Chinese dict is `chinese` (search for the start of the second `const`). Both end with a closing `};`.

- [ ] **Step 1: Add new English keys to `english`.**

Inside the `english` const, before the closing `};`, add a clearly delimited block:

```ts
  // === marketing chrome / nav ===
  "nav.home": "Home",
  "nav.product": "Product",
  "nav.access": "Access",
  "nav.about": "About",
  "nav.signIn": "Sign in",
  "nav.openWorkspace": "Open the workspace",
  "mast.localFirst": "Local-first by default",
  "mast.edition": "Team A MVP · v0.14",
  "foot.tagline": "A local-first analyst workspace for source-ranked, persona-aware briefings, with full evidence trails.",
  "foot.builtAs": "Built as a course MVP · team-a / mvp-v1",
  // === marketing home ===
  "home.eyebrow": "The newsroom workstation · for analysts",
  "home.title.a": "Briefings worth",
  "home.title.b": "the byline.",
  "home.deck": "News Intelligence Studio turns scattered coverage into source-ranked, persona-aware research, local-first, with every claim traceable to the source that supports it.",
  "home.cta.workspace": "Open the workspace",
  "home.cta.sample": "Read the example brief →",
  "home.byline": "⧸ Files stay on your machine. Models, the artifact store, and exports are all local.",
  "home.pipeline.eyebrow": "The pipeline · Six agents",
  "home.pipeline.title.a": "Six small agents,",
  "home.pipeline.title.b": "one circulated brief.",
  "home.personas.eyebrow": "The lens · Six personas",
  "home.personas.title.a": "One topic, briefed six ways:",
  "home.personas.title.b": "each with its own section titles.",
  "home.personas.aside": "Each persona re-titles the report sections, picks its own focus, and instructs the summariser with its own comparison axes.",
  "home.tour.eyebrow": "The studio · A tour",
  "home.tour.title.a": "A workspace that reads like a brief,",
  "home.tour.title.b": "and reasons like a desk.",
  "home.steps.eyebrow": "The method · Four moves",
  "home.steps.title.a": "From a topic to a circulated brief,",
  "home.steps.title.b": "in the time it takes to read one.",
  "fig.caption": "The example brief for \"{topic}\" through the {persona} lens, drawn from artifacts/{id}/brief.json.",
  "step.compose": "Compose",
  "step.composeCopy": "Type a topic. Add an optional research goal. Pick one of six personas and a coverage mode. Submit.",
  "step.collect": "Collect",
  "step.collectCopy": "Trusted RSS first, Google News fallback, curated dataset if both come up dry. The brief surfaces which path it took.",
  "step.reason": "Reason",
  "step.reasonCopy": "Sources are scored on credibility, freshness, and topic fit. The summariser writes along the persona's comparison axes.",
  "step.export": "Export",
  "step.exportCopy": "HTML for circulation, Markdown for git, JSON for the Team B handoff. Every claim keeps its citation across formats.",
  // === marketing access ===
  "access.eyebrow": "Course MVP access",
  "access.title.a": "One workspace,",
  "access.title.b": "three roles.",
  "access.deck": "The MVP keeps access simple while the workflow proves itself: sign in through secure local access, then work in the real command center. No seats, no cloud, no card.",
  "access.plan": "Team A MVP",
  "access.price": "Demo access",
  "access.planCopy": "Everything needed to evaluate the reporting workflow in class and stakeholder demos.",
  "access.rolesTitle": "Roles · enforced by RBAC",
  "access.note": "Public pages lead into the existing login gate and the current workspace; demo users never land in a separate mock interface.",
  "access.feature.reports": "Generate source-ranked, persona-aware briefs",
  "access.feature.sources": "Manage trusted-source preferences",
  "access.feature.exports": "Export HTML, Markdown, and the JSON handoff",
  "access.feature.roles": "Use viewer, analyst, and admin roles",
  // === marketing about ===
  "about.eyebrow": "About · the build",
  "about.title.a": "A workstation for",
  "about.title.b": "the desk.",
  "about.deck": "News Intelligence Studio is a course MVP (team-a / mvp-v1): a static React frontend over a Python FastAPI backend, with briefs persisted as JSON / HTML / Markdown files in a local artifact store.",
  "about.principles": "Three commitments",
  "about.p1": "Traceable by default",
  "about.p1c": "Every claim cites the source that supports it. The source-evidence table ships inline and in every export. A brief with no receipts is not a brief.",
  "about.p2": "Local-first, no fine print",
  "about.p2c": "Briefs, the artifact store, and exports stay on the workstation. Saved mode makes zero outbound calls; Balanced and Live fetch trusted RSS plus Google News RSS.",
  "about.p3": "The brief is the protocol",
  "about.p3c": "Six small agents read and write one brief schema. Swap the model or the retriever; the schema, and the Team B handoff, stays stable.",
  "about.fact.stack": "Stack",
  "about.fact.stackV": "React (Vite) + FastAPI",
  "about.fact.storage": "Storage",
  "about.fact.storageV": "Local JSON / HTML / MD files",
  "about.fact.sources": "Sources",
  "about.fact.sourcesV": "9-outlet registry + RSS + dataset",
  "about.fact.langs": "Languages",
  "about.fact.langsV": "English + 简体中文",
  // === marketing common ===
  "common.default": "Default",
  "common.example": "Example brief",
  // === marketing product (long-form) ===
  "product.section": "Product",
  "product.eyebrow": "The product · A workstation, not an app",
  "product.title.a": "A briefing,",
  "product.title.b": "start to byline.",
  "product.deck": "News Intelligence Studio is one application with five working parts: a composer, a source-weighting model, a persona library, an evidence trail, and a set of exports, used in that order.",
  "product.contents": "Contents · this page",
  "product.fig1.eyebrow": "Fig. 1 · The whole workspace",
  "product.fig1.title.a": "The view a reviewer gets,",
  "product.fig1.title.b": "once a brief is filed.",
  // 5 feature sections
  "product.f1.tag": "COMPOSER",
  "product.f1.h": "Type a topic. Pick a lens. File.",
  "product.f1.lede": "The composer is the only place an analyst types: topic, an optional research goal, a persona, and a coverage mode. Submit, and the six-agent pipeline does the rest.",
  "product.f1.b1.h": "Free-form topic",
  "product.f1.b1.p": "No keyword grammar. The collector turns the topic into trusted-RSS queries, Google News terms, and dataset filters.",
  "product.f1.b2.h": "Research goal",
  "product.f1.b2.p": "Optional one-liner that biases the summariser toward the decision the desk needs to make.",
  "product.f1.b3.h": "Persona lens",
  "product.f1.b3.p": "Picks which section titles appear and what the comparison axes are.",
  "product.f1.b4.h": "Coverage mode",
  "product.f1.b4.p": "Balanced / Live / Saved (auto / live / fallback), surfaced on the brief so reviewers know which path it took.",
  "product.f2.tag": "SOURCE RANKING",
  "product.f2.h": "Three signals, one visible score.",
  "product.f2.lede": "Sources are scored on a model the brief carries with it. No black box: the weights are printed and the formula is documented in ranking.py.",
  "product.f2.b1.h": "Credibility · 0.45",
  "product.f2.b1.p": "Per-outlet weight from the source registry; default 0.45 for unlisted outlets. A trusted-source match is boosted to 1.0.",
  "product.f2.b2.h": "Freshness · 0.35",
  "product.f2.b2.p": "Stepped age decay: ≤6h is full marks, then 24h / 72h / 7d steps down to a 0.25 floor. Missing dates default to 0.25.",
  "product.f2.b3.h": "Topic fit · 0.20",
  "product.f2.b3.p": "Keyword overlap between the topic and the article title + snippet, capped at 1.0. Live results must clear 0.45 to be selected.",
  "product.f2.b4.h": "Coverage breadth",
  "product.f2.b4.p": "Thin or single-outlet coverage is surfaced in the confidence panel and the Watch section, not hidden.",
  "product.f3.tag": "PERSONA LIBRARY",
  "product.f3.h": "Six lenses. Each renames the sections.",
  "product.f3.lede": "Personas are not skins. Each lens re-titles the report sections, picks its own focus, and instructs the summariser with its own comparison axes. A seventh (Market watch) is defined in the code but not exposed in the picker.",
  "product.f3.b1.h": "Section titles",
  "product.f3.b1.p": "A Risk lens does not rename \"Key takeaways\"; it replaces the whole set: Risk facts, Warning signals, Risk watch.",
  "product.f3.b2.h": "Comparison axes",
  "product.f3.b2.p": "Each persona ships its own framing-diff axes; the comparison agent reads them, not a fixed template.",
  "product.f3.b3.h": "Default lens",
  "product.f3.b3.p": "Research analyst is the default. It is the first option in the composer.",
  "product.f4.tag": "EVIDENCE TRAIL",
  "product.f4.h": "Every claim, traceable to its source.",
  "product.f4.lede": "A claim with no receipt is not a claim. The Studio renders the source-evidence table inline in the report and ships it with every export.",
  "product.f4.b1.h": "Citations",
  "product.f4.b1.p": "Each selected article carries id / title / source / url / published_at, kept alongside its credibility, freshness, and topic-fit scores.",
  "product.f4.b2.h": "Why-selected",
  "product.f4.b2.p": "Every source row carries a short generated rationale (\"High source trust, strong topic fit.\").",
  "product.f4.b3.h": "Coverage note",
  "product.f4.b3.p": "The framing comparison surfaces how outlets differ on the lead frame; conflicts are kept, not flattened.",
  "product.f5.tag": "EXPORTS",
  "product.f5.h": "HTML, Markdown, JSON: same brief.",
  "product.f5.lede": "Three exports, one schema. HTML for circulation, Markdown for git, JSON for the Team B handoff contract. Citations travel with the file.",
  "product.f5.b1.h": "HTML · /briefs/:id/export",
  "product.f5.b1.p": "Renders the in-app report. Embed in an email, paste in a wiki, print to PDF.",
  "product.f5.b2.h": "Markdown · /briefs/:id/export.md",
  "product.f5.b2.p": "For git, course reports, and pull-request reviews.",
  "product.f5.b3.h": "JSON · /briefs/:id/handoff",
  "product.f5.b3.p": "Stable IDs, source-evidence rows, pipeline metadata, persona axes. Admin-only (handoff:read).",
  // Worked example + coverage + architecture
  "product.worked.eyebrow": "The source model · A worked example",
  "product.worked.title.a": "Five sources,",
  "product.worked.title.b": "scored and ranked.",
  "product.worked.formula": "The formula · per source",
  "product.worked.score": "score",
  "product.worked.cred": "cred",
  "product.worked.fresh": "fresh",
  "product.worked.fit": "fit",
  "product.worked.col.outlet": "Outlet",
  "product.worked.col.cred": "Cred",
  "product.worked.col.fresh": "Fresh",
  "product.worked.col.fit": "Fit",
  "product.worked.col.total": "Total",
  "product.coverage.eyebrow": "Coverage modes · A demo never fails dark",
  "product.coverage.title.a": "Three retrievers,",
  "product.coverage.title.b": "one explicit fallback chain.",
  "product.coverage.mode": "MODE",
  "product.arch.eyebrow": "The architecture · Local by construction",
  "product.arch.title.a": "A workstation,",
  "product.arch.title.b": "not a tenant.",
  "product.arch.row1.h": "No accounts",
  "product.arch.row1.p": "Authentication is an X-API-Key (or your reverse-proxy SSO). Demo tokens map to roles; RBAC can be disabled via env.",
  "product.arch.row2.h": "Local artifact store",
  "product.arch.row2.p": "Briefs persist as JSON / HTML / Markdown files on disk; there is no database.",
  "product.arch.row3.h": "No vendor lock-in",
  "product.arch.row3.p": "Models are OpenAI-compatible (bring your own key) or a deterministic local builder. Same brief schema either way.",
  "product.arch.row4.h": "Saved mode is offline",
  "product.arch.row4.p": "Saved mode makes zero outbound calls. Balanced and Live fetch trusted RSS + Google News RSS, and the brief says which it used.",
  "product.arch.boundary": "The local boundary · what runs where",
  "product.arch.workstation": "WORKSTATION",
  "product.arch.outbound": "↑ OUTBOUND",
  "product.arch.balancedOnly": "BALANCED / LIVE ONLY",
  "product.arch.box.composer": "Composer",
  "product.arch.box.pipeline": "Pipeline · 6 agents",
  "product.arch.box.registry": "Source registry",
  "product.arch.box.personas": "Persona library",
  "product.arch.box.store": "Artifact store",
  "product.arch.box.exports": "HTML / MD export",
  "product.arch.box.handoff": "JSON handoff",
  "product.arch.box.rbac": "RBAC · 3 roles",
  "product.arch.out.rss": "Trusted RSS feeds",
  "product.arch.out.gnews": "Google News RSS",
  "product.arch.out.byok": "BYO model API",
  "product.arch.out.sso": "Reverse-proxy SSO",
  // Ranking signal labels (Chinese override happens via key)
  "ranking.cred.label": "Credibility",
  "ranking.cred.blurb": "Per-outlet weight from the source registry; default 0.45 for unlisted outlets. A trusted-source preference boosts a matched outlet to 1.0.",
  "ranking.fresh.label": "Freshness",
  "ranking.fresh.blurb": "Stepped age decay: ≤6h → 1.0, ≤24h → 0.85, ≤72h → 0.65, ≤7d → 0.45, older → 0.25. Missing dates default to 0.25.",
  "ranking.fit.label": "Topic fit",
  "ranking.fit.blurb": "Keyword-token overlap between the topic and the article title + snippet, capped at 1.0. Live results must clear 0.45 to be selected.",
  // Coverage mode labels (Chinese override happens via key)
  "coverage.auto.label": "Balanced",
  "coverage.auto.flow": "RSS → Google News → dataset",
  "coverage.auto.blurb": "Trusted RSS, then Google News, then the curated dataset, whichever returns enough signal first.",
  "coverage.live.label": "Live",
  "coverage.live.flow": "RSS + Google News only",
  "coverage.live.blurb": "Force the live retrievers: trusted RSS plus Google News RSS.",
  "coverage.fallback.label": "Saved",
  "coverage.fallback.flow": "curated dataset, offline",
  "coverage.fallback.blurb": "Force the curated dataset: for offline demos and reproducible briefs.",
  // Pipeline agent name overrides (English values reuse data.js; the keys exist for parity)
  "pipeline.01.name": "Collector",
  "pipeline.02.name": "Filter & rank",
  "pipeline.03.name": "Summariser",
  "pipeline.04.name": "Comparison",
  "pipeline.05.name": "Insight",
  "pipeline.06.name": "Report",
```

- [ ] **Step 2: Add matching Chinese keys to `chinese`.**

Source: `Website UIUX/prod/i18n.js` ZH dict (lines 121–222). Where keys map directly (`nav.home`, `home.title.a`, etc.), copy the Chinese strings verbatim. For the new `product.*` keys (which were inline ternaries in the prototype), translate from the English copy using the Chinese phrasings already authored in `marketing.jsx` lines 275–311 and 353–361. The `ranking.*` and `coverage.*` Chinese values come from `marketing.jsx` lines 353–360.

Use the same key list as Step 1 and the matching Chinese strings. (The plan keeps this short by reference; the executing-plans skill should consult `Website UIUX/prod/i18n.js` and `marketing.jsx` directly.)

---

## Task 8: Add `localizePersonaById` helper to `i18n.ts`

**Files:**
- Modify: `team-a/mvp-v1/frontend/src/i18n.ts`

- [ ] **Step 1: Add a helper at the bottom of `i18n.ts`.**

After the existing `localizePersona` export, append:

```ts
import type { PersonaLensId } from "./types";

export function localizePersonaById(
  id: PersonaLensId,
  language: Language,
  fallback: { label: string; short: string },
): { label: string; short: string } {
  return personaLabels[language][id] || fallback;
}
```

If `personaLabels` doesn't already export an `en` map with all six personas (it does — `personaLabels.en` is `{}` so this helper falls back to the supplied English values), this works as-is.

---

## Task 9: Create `EditorialIcons.tsx`

**Files:**
- Create: `team-a/mvp-v1/frontend/src/components/marketing/EditorialIcons.tsx`

- [ ] **Step 1: Port `chrome.jsx` lines 290–311 to TSX.**

```tsx
import type { PersonaLensId } from "../../types";

type GlyphProps = { value: PersonaLensId; color?: string };

export function PersonaGlyph({ value, color }: GlyphProps) {
  const c = color || "currentColor";
  const map: Record<PersonaLensId, JSX.Element> = {
    research_analyst: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="1.5" width="8" height="11" rx="1.5" stroke={c} strokeWidth="1.4" />
        <path d="M4 4.5h4M4 7h3" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="10" cy="10.5" r="2" stroke={c} strokeWidth="1.4" />
      </svg>
    ),
    financial_analyst: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <path d="M2 11l3-4 3 2 4-6" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 4v3h-3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    executive_brief: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <rect x="1.5" y="4" width="11" height="8" rx="1.4" stroke={c} strokeWidth="1.4" />
        <path d="M5 4V2.5h4V4" stroke={c} strokeWidth="1.4" />
        <path d="M1.5 8h11" stroke={c} strokeWidth="1.4" />
      </svg>
    ),
    policy_intelligence: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <path d="M7 2l5 2H2l5-2z" fill={c} />
        <path d="M3 5v6M11 5v6M5.5 5v6M8.5 5v6" stroke={c} strokeWidth="1.2" />
        <path d="M2 12h10" stroke={c} strokeWidth="1.4" />
      </svg>
    ),
    academic_researcher: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <path d="M1 5l6-2.5 6 2.5-6 2.5L1 5z" stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M3.5 6.5v3c0 .8 1.6 1.5 3.5 1.5s3.5-.7 3.5-1.5v-3" stroke={c} strokeWidth="1.4" />
      </svg>
    ),
    risk_analyst: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5L1.5 4v3.5c0 3 2.5 5 5.5 5s5.5-2 5.5-5V4L7 1.5z" stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M7 5v3M7 9.8v.2" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };
  return map[value] || map.research_analyst;
}

export type RailIconKind = "search" | "bookmark" | "radio";

export function RailIcon({ kind }: { kind: RailIconKind }) {
  const c = "currentColor";
  const map: Record<RailIconKind, JSX.Element> = {
    search: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="6" cy="6" r="4" stroke={c} strokeWidth="1.4" />
        <path d="M9 9l3 3" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    bookmark: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3.5 2h7v10l-3.5-2.2L3.5 12V2z" stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
    radio: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="1.4" fill={c} />
        <path
          d="M4.2 4.2c-1.5 1.5-1.5 4.1 0 5.6M9.8 4.2c1.5 1.5 1.5 4.1 0 5.6M2.6 2.6c-2.4 2.4-2.4 6.4 0 8.8M11.4 2.6c2.4 2.4 2.4 6.4 0 8.8"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    ),
  };
  return map[kind];
}
```

---

## Task 10: Create `EditorialChrome.tsx`

**Files:**
- Create: `team-a/mvp-v1/frontend/src/components/marketing/EditorialChrome.tsx`

- [ ] **Step 1: Port `chrome.jsx` lines 156–287 to TSX.**

Each function takes explicit `{ language, t, onLanguageChange? }` props instead of pulling from `useT()` (we don't use React context here — the parent passes them down).

Components to export: `ALogo`, `ALangToggle`, `AMasthead`, `ANav`, `AFooter`, `ASectionHead`.

Key adaptations from the JSX source:

- Replace `const { lang, t } = useT()` with `props.language` and `props.t`.
- Replace `setLang(v)` with `props.onLanguageChange(v)`.
- The `ANav` items: drop the `accuracy` entry. Change route hrefs from `#/...` to `/...`.
- Drop the prototype's `ANav` "Open workspace" hover-state nuance — keep the same `.a-btn-primary` link to `/workspace`.
- `AFooter` columns: keep four columns but drop the Accuracy link in the Product column (replace it with a fourth link to `home.tour.eyebrow` content or remove and balance the list).

Skeleton (each function follows this prop shape):

```tsx
import type { Language, TFunction } from "../../i18n";

type ChromeProps = {
  language: Language;
  t: TFunction;
  onLanguageChange: (language: Language) => void;
};

export function ALogo() { /* dot mark + product name */ }

export function ALangToggle({ language, onLanguageChange }: Pick<ChromeProps, "language" | "onLanguageChange">) { /* … */ }

export function AMasthead({ section, language, t }: ChromeProps & { section?: string }) { /* … */ }

type Active = "home" | "product" | "access" | "about";
export function ANav({ active, language, t, onLanguageChange }: ChromeProps & { active: Active }) {
  const items: Array<[Active, string, string]> = [
    ["home", t("nav.home"), "/"],
    ["product", t("nav.product"), "/product"],
    ["access", t("nav.access"), "/access"],
    ["about", t("nav.about"), "/about"],
  ];
  /* render with .a-nav, .a-nav-links, etc. */
}

export function AFooter({ language, t }: Omit<ChromeProps, "onLanguageChange">) { /* … */ }

export function ASectionHead({ eyebrow, title, italicTail, aside }: { eyebrow: string; title: React.ReactNode; italicTail?: React.ReactNode; aside?: string }) { /* … */ }
```

Copy the JSX structure inside each component verbatim from `chrome.jsx`. The CSS classes are already in `styles.css` from Task 4 so all the existing class names work unchanged.

For `AMasthead`, the date string uses `new Date().toLocaleDateString(...)` exactly as in the prototype.

---

## Task 11: Create `EditorialMocks.tsx`

**Files:**
- Create: `team-a/mvp-v1/frontend/src/components/marketing/EditorialMocks.tsx`

- [ ] **Step 1: Port `marketing.jsx` lines 7–42 (`EditorialBriefMock`) and 45–167 (`EditorialAppMock`).**

Replace `useT()` with `{ language, t }` props. Replace `STUDIO.DEMO_BRIEF` with an import of `DEMO_BRIEF` from `../../marketingData`. Replace `STUDIO.PRODUCT.endpoint` and `STUDIO.PRODUCT.edition` with imports from `marketingData`.

```tsx
import type { Language, TFunction } from "../../i18n";
import { DEMO_BRIEF, PRODUCT } from "../../marketingData";
import { RailIcon } from "./EditorialIcons";

type MockProps = { language: Language; t: TFunction };

const GREEN = "#116149";
const GREEN_SOFT = "#dceee2";
const GREEN_DEEP = "#0d523d";

export function EditorialBriefMock({ language, t }: MockProps) {
  const b = DEMO_BRIEF;
  /* full JSX body from marketing.jsx lines 9–41, with `t` replaced where used */
}

export function EditorialAppMock({ language, t }: MockProps) {
  const zh = language === "zh";
  const b = DEMO_BRIEF;
  /* full JSX body from marketing.jsx lines 47–166 */
}
```

The inline-JSX literals (`zh ? '要点' : 'Takeaways'`, etc.) stay inline in this file — we are not lifting them to i18n keys for the mocks because they're literal text inside a screenshot-style visual.

---

## Task 12: Create `MarketingHome.tsx`

**Files:**
- Create: `team-a/mvp-v1/frontend/src/components/marketing/MarketingHome.tsx`

- [ ] **Step 1: Port `marketing.jsx` `DirectionAHome` (lines 170–268) to TSX.**

Imports:

```tsx
import type { Language, TFunction } from "../../i18n";
import { localizePersonaById } from "../../i18n";
import { DEMO_BRIEF, PERSONAS, PIPELINE } from "../../marketingData";
import { AFooter, AMasthead, ANav, ASectionHead } from "./EditorialChrome";
import { PersonaGlyph } from "./EditorialIcons";
import { EditorialAppMock, EditorialBriefMock } from "./EditorialMocks";

type PageProps = { language: Language; t: TFunction; onLanguageChange: (l: Language) => void };

export function MarketingHome({ language, t, onLanguageChange }: PageProps) {
  /* full body from DirectionAHome, with hash links #/workspace → /workspace */
}
```

Replace:
- `useT()` → use props directly.
- `STUDIO.DEMO_BRIEF` → `DEMO_BRIEF`.
- `STUDIO.PERSONAS` → `PERSONAS`.
- `STUDIO.PIPELINE` → `PIPELINE`.
- `#/workspace` → `/workspace`.
- `#/access` → `/access`.
- `(window.STUDIO_I18N.persona(lang, p.value, null) || {}).label` → `localizePersonaById(p.value, language, { label: p.label, short: p.short }).label`. Same for `.short`.

Pass `language={language} t={t} onLanguageChange={onLanguageChange}` to `<AMasthead>`, `<ANav active="home" …>`, `<AFooter>`. Pass `language, t` to `<EditorialBriefMock>` and `<EditorialAppMock>`.

---

## Task 13: Create `MarketingProduct.tsx`

**Files:**
- Create: `team-a/mvp-v1/frontend/src/components/marketing/MarketingProduct.tsx`

- [ ] **Step 1: Port `marketing.jsx` `DirectionAProduct` (lines 271–515) to TSX.**

This is the largest page. Replace inline `zh ? … : …` ternaries that build the `features`, `signals`, and `coverageModes` arrays with i18n key lookups via `t()` using the keys added in Task 7 under the `product.*`, `ranking.*`, and `coverage.*` namespaces.

Imports:

```tsx
import type { Language, TFunction } from "../../i18n";
import { COVERAGE_MODES, DEMO_BRIEF, SIGNALS } from "../../marketingData";
import { AFooter, AMasthead, ANav, ASectionHead } from "./EditorialChrome";
import { EditorialAppMock } from "./EditorialMocks";

type PageProps = { language: Language; t: TFunction; onLanguageChange: (l: Language) => void };
```

Replace the inline `features = zh ? […] : […]` block with a single array built from i18n:

```ts
const features = [
  { n: "I",   tag: t("product.f1.tag"), h: t("product.f1.h"), lede: t("product.f1.lede"),
    bullets: [
      [t("product.f1.b1.h"), t("product.f1.b1.p")],
      [t("product.f1.b2.h"), t("product.f1.b2.p")],
      [t("product.f1.b3.h"), t("product.f1.b3.p")],
      [t("product.f1.b4.h"), t("product.f1.b4.p")],
    ],
  },
  /* f2, f3, f4, f5 the same shape */
];
```

Replace `signals = zh ? […] : STUDIO.SIGNALS` with:

```ts
const signals = SIGNALS.map((sg) => ({
  ...sg,
  label: t(`ranking.${sg.key === "c" ? "cred" : sg.key === "f" ? "fresh" : "fit"}.label`),
  blurb: t(`ranking.${sg.key === "c" ? "cred" : sg.key === "f" ? "fresh" : "fit"}.blurb`),
}));
```

Replace `coverageModes` similarly using the `coverage.*` keys.

Architecture box workstation/outbound labels use the `product.arch.*` keys.

Route fixes: `#/workspace` → `/workspace`. The prototype's `#/accuracy` CTA in the hero (`<a … href="#/accuracy">{t('nav.accuracy')} →</a>`) gets rewired to `<a … href="/about">{t("nav.about")} →</a>` since Accuracy is out of scope and About is the closest informational sibling.

---

## Task 14: Create `MarketingAccess.tsx`

**Files:**
- Create: `team-a/mvp-v1/frontend/src/components/marketing/MarketingAccess.tsx`

- [ ] **Step 1: Port `marketing2.jsx` `DirectionAAccess` (lines 3–72) to TSX.**

Imports:

```tsx
import type { Language, TFunction } from "../../i18n";
import { localizeRole } from "../../i18n";
import { ROLES } from "../../marketingData";
import { AFooter, AMasthead, ANav } from "./EditorialChrome";

type PageProps = { language: Language; t: TFunction; onLanguageChange: (l: Language) => void };

export function MarketingAccess({ language, t, onLanguageChange }: PageProps) {
  const planFeatures = [
    t("access.feature.reports"),
    t("access.feature.sources"),
    t("access.feature.exports"),
    t("access.feature.roles"),
  ];
  /* body from DirectionAAccess */
}
```

Replace `window.STUDIO_I18N.role(lang, r.value, r.label)` with `localizeRole(r.value, language, r.label)`.

Replace `#/login` → `/login`. Keep the hardcoded `section="Access"` on `AMasthead` (it's display-only text on the masthead strip).

---

## Task 15: Create `MarketingAbout.tsx`

**Files:**
- Create: `team-a/mvp-v1/frontend/src/components/marketing/MarketingAbout.tsx`

- [ ] **Step 1: Port `marketing2.jsx` `DirectionAAbout` (lines 74–127) to TSX.**

Imports:

```tsx
import type { Language, TFunction } from "../../i18n";
import { AFooter, AMasthead, ANav, ASectionHead } from "./EditorialChrome";

type PageProps = { language: Language; t: TFunction; onLanguageChange: (l: Language) => void };

export function MarketingAbout({ language, t, onLanguageChange }: PageProps) {
  const principles: Array<[string, string]> = [
    ["about.p1", "about.p1c"],
    ["about.p2", "about.p2c"],
    ["about.p3", "about.p3c"],
  ];
  const facts: Array<[string, string]> = [
    [t("about.fact.stack"),   t("about.fact.stackV")],
    [t("about.fact.storage"), t("about.fact.storageV")],
    [t("about.fact.sources"), t("about.fact.sourcesV")],
    [t("about.fact.langs"),   t("about.fact.langsV")],
  ];
  /* body from DirectionAAbout */
}
```

Replace `#/workspace` → `/workspace`. The prototype's `<a href="#/accuracy">{t('nav.accuracy')}</a>` ghost button at the bottom gets rewired to a ghost button linking to `/product` (`t("nav.product")`).

---

## Task 16: Wire `App.tsx` routes

**Files:**
- Modify: `team-a/mvp-v1/frontend/src/App.tsx`

- [ ] **Step 1: Replace imports.**

In the import block at the top of `App.tsx`, replace:

```tsx
import { MarketingHomePage, PricingPage } from "./components/MarketingPages";
```

with:

```tsx
import { MarketingHome } from "./components/marketing/MarketingHome";
import { MarketingProduct } from "./components/marketing/MarketingProduct";
import { MarketingAccess } from "./components/marketing/MarketingAccess";
import { MarketingAbout } from "./components/marketing/MarketingAbout";
```

- [ ] **Step 2: Update the `AppRoute` type.**

Replace:

```tsx
type AppRoute = "home" | "pricing" | "login" | "workspace";
```

with:

```tsx
type AppRoute = "home" | "product" | "access" | "about" | "login" | "workspace";
```

- [ ] **Step 3: Update `getCurrentRoute()` (bottom of file).**

Replace:

```tsx
function getCurrentRoute(): AppRoute {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/pricing") return "pricing";
  if (pathname === "/login") return "login";
  if (pathname === "/workspace") return "workspace";
  return "home";
}
```

with:

```tsx
function getCurrentRoute(): AppRoute {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/product") return "product";
  if (pathname === "/access") return "access";
  if (pathname === "/about") return "about";
  if (pathname === "/login") return "login";
  if (pathname === "/workspace") return "workspace";
  return "home";
}
```

- [ ] **Step 4: Update the render block route ladder.**

Replace the two `if` blocks at line 392–398:

```tsx
  if (route === "home") {
    return <MarketingHomePage language={language} t={t} onLanguageChange={setLanguage} />;
  }

  if (route === "pricing") {
    return <PricingPage language={language} t={t} onLanguageChange={setLanguage} />;
  }
```

with:

```tsx
  if (route === "home") {
    return <MarketingHome language={language} t={t} onLanguageChange={setLanguage} />;
  }
  if (route === "product") {
    return <MarketingProduct language={language} t={t} onLanguageChange={setLanguage} />;
  }
  if (route === "access") {
    return <MarketingAccess language={language} t={t} onLanguageChange={setLanguage} />;
  }
  if (route === "about") {
    return <MarketingAbout language={language} t={t} onLanguageChange={setLanguage} />;
  }
```

---

## Task 17: Delete old marketing files and selectors

**Files:**
- Delete: `team-a/mvp-v1/frontend/src/components/MarketingPages.tsx`
- Modify: `team-a/mvp-v1/frontend/src/i18n.ts`
- Modify: `team-a/mvp-v1/frontend/src/styles.css`

- [ ] **Step 1: Delete the old marketing module.**

```bash
rm team-a/mvp-v1/frontend/src/components/MarketingPages.tsx
```

- [ ] **Step 2: Remove old `marketing.*` keys from both dicts in `i18n.ts`.**

Search for every key starting with `"marketing.` in `i18n.ts` and delete those lines (in both `english` and `chinese` dicts). The keys to remove are listed in the spec (`marketing.nav.label`, `marketing.nav.home`, `marketing.nav.pricing`, `marketing.eyebrow`, `marketing.home.title`, `marketing.home.copy`, `marketing.cta.workspace`, `marketing.cta.pricing`, `marketing.cta.signIn`, `marketing.preview.label`, `marketing.preview.title`, `marketing.preview.status`, `marketing.preview.topic`, `marketing.proof.sources`, `marketing.proof.exports`, `marketing.proof.rbac`, `marketing.workflow.label`, `marketing.workflow.collect`, `marketing.workflow.collectCopy`, `marketing.workflow.analyze`, `marketing.workflow.analyzeCopy`, `marketing.workflow.handoff`, `marketing.workflow.handoffCopy`, `marketing.pricing.eyebrow`, `marketing.pricing.title`, `marketing.pricing.copy`, `marketing.pricing.planLabel`, `marketing.pricing.plan`, `marketing.pricing.price`, `marketing.pricing.planCopy`, `marketing.pricing.feature.reports`, `marketing.pricing.feature.sources`, `marketing.pricing.feature.exports`, `marketing.pricing.feature.roles`, `marketing.pricing.noteTitle`, `marketing.pricing.noteCopy`).

After removal, verify:

```bash
cd team-a/mvp-v1 && grep -n '"marketing\.' frontend/src/i18n.ts || echo "OK: no marketing.* keys remain"
```

Expected: "OK: no marketing.* keys remain".

- [ ] **Step 3: Remove old marketing/pricing selectors from `styles.css`.**

In `styles.css`, delete the rule blocks for these selectors (search and remove each):

- `.marketing-page`
- `.marketing-nav`
- `.marketing-brand`
- `.marketing-hero`
- `.marketing-hero-copy`
- `.marketing-brief-preview`
- `.marketing-preview-head`
- `.marketing-preview-topic`
- `.marketing-preview-grid`
- `.marketing-actions`
- `.marketing-band`
- `.marketing-step`
- `.pricing-hero`
- `.pricing-layout`
- `.pricing-plan`
- `.pricing-plan-head`
- `.pricing-note`

For `.eyebrow`, `.primary-button`, `.secondary-button`, `.text-link-button`: before removing, grep to confirm no other page uses them:

```bash
cd team-a/mvp-v1 && grep -rn 'className=".*\(primary-button\|secondary-button\|text-link-button\|eyebrow\)\b' frontend/src/
```

Remove only the ones with zero remaining references.

---

## Task 18: Build and verify

**Files:** none

- [ ] **Step 1: Run pytest.**

```bash
cd team-a/mvp-v1 && .venv/bin/pytest -q
```

Expected: all tests pass.

- [ ] **Step 2: Build the frontend.**

```bash
cd team-a/mvp-v1/frontend && npm install --silent && npm run build
```

Expected: Vite emits `team-a/mvp-v1/news_brief_mvp/static/react/index.html` plus `assets/*.js` and `assets/*.css` with no TypeScript errors.

- [ ] **Step 3: Boot the app and smoke-test the four routes.**

In one terminal:

```bash
lsof -ti:8000 | xargs kill -9 2>/dev/null; cd team-a/mvp-v1 && ./run_local.sh
```

In another:

```bash
curl -s -o /dev/null -w "/        %{http_code}\n" http://127.0.0.1:8000/
curl -s -o /dev/null -w "/product %{http_code}\n" http://127.0.0.1:8000/product
curl -s -o /dev/null -w "/access  %{http_code}\n" http://127.0.0.1:8000/access
curl -s -o /dev/null -w "/about   %{http_code}\n" http://127.0.0.1:8000/about
curl -s -o /dev/null -w "/pricing %{http_code}\n" http://127.0.0.1:8000/pricing
```

Expected:

```
/        200
/product 200
/access  200
/about   200
/pricing 404
```

- [ ] **Step 4: Inline-render check.**

Open `http://127.0.0.1:8000/` in a browser and visually verify each page (Home, Product, Access, About) renders without console errors, with the editorial typography (Source Serif 4 + IBM Plex). Toggle language to 中文 and reload each page; check that nothing reverts to English. Click "Open the workspace →" and confirm it lands at `/login` (no session).

---

## Task 19: Commit the implementation

- [ ] **Step 1: Stage and commit.**

```bash
cd /Users/hyrsta/.openclaw/workspaces/course-projects/项目管理/fudan-project-management/.claude/worktrees/objective-bardeen-ea8762
git add team-a/mvp-v1/news_brief_mvp/main.py \
        team-a/mvp-v1/tests/test_marketing_routes.py \
        team-a/mvp-v1/frontend/index.html \
        team-a/mvp-v1/frontend/src/App.tsx \
        team-a/mvp-v1/frontend/src/i18n.ts \
        team-a/mvp-v1/frontend/src/styles.css \
        team-a/mvp-v1/frontend/src/types.ts \
        team-a/mvp-v1/frontend/src/marketingData.ts \
        team-a/mvp-v1/frontend/src/components/marketing/ \
        team-a/mvp-v1/news_brief_mvp/static/react/
git rm team-a/mvp-v1/frontend/src/components/MarketingPages.tsx
git commit -m "$(cat <<'MSG'
Port editorial landing site (Home / Product / Access / About)

Replaces the minimal MarketingHomePage and PricingPage with the four-page
editorial design from 项目管理/Website UIUX/. Shared chrome (Masthead,
Nav, Footer, SectionHead), two visual mocks (BriefMock, AppMock), and a
typed marketingData module live under components/marketing/. The .a-root
design system rides in styles.css, scoped to prevent leakage into the
workspace. i18n keys merged for EN + 中文. FastAPI gains /product /access
/about decorators on index(); /pricing is removed. Backend smoke test
covers the new routes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Self-Review

**Spec coverage:** all spec sections have a task. Routing → T2/T3/T16. File layout → T6/T9–T15/T17. Components → T9–T15. Data → T5/T6. Styling → T4. Fonts → T1. i18n → T7/T8/T17. Verification → T2/T18. Risks: font CDN (T1 documents it), `.a-root` scoping (T4 enforces it), i18n key removal (T17 step 2 greps to verify).

**Placeholder scan:** Task 6 leaves the marketingData array bodies as "fill from data.js verbatim" rather than inlining ~180 lines of constants; same for Task 7 Step 2 (Chinese strings). The instruction is precise enough — the source file and line ranges are specified — and the executor (me) has Read access to those files.

**Type consistency:** `PersonaLensId`, `RoleSpec`, `CoverageModeSpec`, `DemoBrief` are defined in Task 5 and consumed identically in Tasks 6, 9, 11, 12, 13, 14, 15.
