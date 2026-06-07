# Team A landing site: Home / Product / Access / About

Date: 2026-06-05
Owner: Team A (Leonardo)
Status: Approved for implementation

## Goal

Replace the team-a app's current minimal marketing surface (`MarketingHomePage`
at `/` and `PricingPage` at `/pricing`) with the four-page editorial landing
site authored in `项目管理/Website UIUX/`: **Home**, **Product**, **Access**,
**About**. The four pages must render in the real team-a build (Vite + React
18 + TypeScript), share the existing i18n flow, and not affect the workspace,
login, or saved-brief views.

## Why this design

The `Website UIUX/` prototype is a faithful production design for the team-a
codebase. Its `AUDIT.md` reconciles every claim against `ranking.py`,
`personas.py`, `auth.py`, `data/source_registry.json`, `frontend/src/App.tsx`,
`i18n.ts`, and `artifacts/`. Porting it preserves that calibration. Re-inventing
the design risks regressing the deliberate editorial typography mix
(Source Serif 4 + IBM Plex + Instrument Serif), the non-lucide glyph set, and
the honest positioning the audit landed on.

## Scope

In scope:

- Four marketing pages at `/`, `/product`, `/access`, `/about`.
- Shared editorial chrome (Masthead, Nav, Footer, SectionHead, Logo, language
  toggle).
- Two visual mocks (small brief card, full app mock) used inside the pages.
- Inline-SVG icon components (PersonaGlyph, RailIcon) ported verbatim.
- Typed demo data module (`marketingData.ts`) mirroring the prototype's
  `DEMO_BRIEF`, `PIPELINE`, `PERSONAS`, `SIGNALS`, `COVERAGE_MODES`, `ROLES`.
- Editorial design system appended to `styles.css`, scoped under `.a-root`.
- Google Fonts link in `frontend/index.html`.
- i18n keys merged into `i18n.ts` for both English and 简体中文.
- FastAPI: add `/product`, `/access`, `/about` routes; drop `/pricing`.
- Removal of old marketing code, CSS selectors, and i18n keys.

Out of scope:

- The prototype's Accuracy page. All `nav.accuracy` references are removed
  from nav and footer; the prototype's CTAs pointing to `/accuracy` are
  rewired to `/access` or `/about` as the design dictates.
- The prototype's `nav.method` slot.
- Login or workspace styling.
- Brief generation, source registry, RBAC, or persona definitions.
- Frontend tests for marketing surfaces (they are presentational with no
  logic). A backend route-existence smoke test is added.

## Approach

**Approach A, faithful port.** JSX from `Website UIUX/prod/*.jsx` is translated
literally to TSX. The four pages and shared chrome live in
`frontend/src/components/marketing/`. The design system CSS is appended to
the existing `styles.css` under a `.a-root` scope so it cannot leak.

This was chosen over an adapted port (Approach B) because the prototype's
glyphs and metrics are deliberate; lucide-react would drift visually. It was
chosen over iframing the prototype (Approach C) because the prototype runs
React + Babel from CDNs at runtime, ships two React runtimes, and cannot
share auth state with the workspace.

## File layout

Additions and changes under `team-a/mvp-v1/`:

```text
team-a/mvp-v1/
├── news_brief_mvp/
│   └── main.py                                  [edit]   route decorators
└── frontend/
    ├── index.html                               [edit]   Google Fonts link
    └── src/
        ├── App.tsx                              [edit]   route union + getCurrentRoute()
        ├── i18n.ts                              [edit]   merge keys, drop marketing.*
        ├── styles.css                           [edit]   append .a-root system
        ├── types.ts                             [edit]   add marketing data types
        ├── marketingData.ts                     [new]
        └── components/
            ├── MarketingPages.tsx               [delete]
            └── marketing/
                ├── EditorialChrome.tsx          [new]
                ├── EditorialMocks.tsx           [new]
                ├── EditorialIcons.tsx           [new]
                ├── MarketingHome.tsx            [new]
                ├── MarketingProduct.tsx         [new]
                ├── MarketingAccess.tsx          [new]
                └── MarketingAbout.tsx           [new]
```

Project-level:

- `.gitignore` already has `.superpowers/` from this brainstorming session.
- New backend test: `team-a/mvp-v1/tests/test_marketing_routes.py`.

## Routing

| Route       | Page                       | New / changed                     |
| ----------- | -------------------------- | --------------------------------- |
| `/`         | Home (`MarketingHome`)     | replaces `MarketingHomePage`      |
| `/product`  | Product (`MarketingProduct`)| new                              |
| `/access`   | Access (`MarketingAccess`) | new (replaces `/pricing`)         |
| `/about`    | About (`MarketingAbout`)   | new                               |
| `/login`    | Login                      | untouched                         |
| `/workspace`| Workspace                  | untouched                         |
| `/briefs/*` | Saved brief views          | untouched                         |

Backend (`news_brief_mvp/main.py`): the decorator stack on `index()` becomes

```python
@app.get("/", response_class=HTMLResponse)
@app.get("/login", response_class=HTMLResponse)
@app.get("/workspace", response_class=HTMLResponse)
@app.get("/product", response_class=HTMLResponse)
@app.get("/access", response_class=HTMLResponse)
@app.get("/about", response_class=HTMLResponse)
def index(request: Request): ...
```

`/pricing` is removed without a redirect.

Frontend (`App.tsx`): `AppRoute` is the union `"home" | "product" | "access" |
"about" | "login" | "workspace"`. `getCurrentRoute()` maps the new pathnames.
The render block at the top of the component grows a small route ladder that
returns the matching marketing page; everything below `if (route === "login"
...)` is untouched.

## Components

All four pages share a single prop shape: `{ language, t, onLanguageChange }`.
They are presentational. No API calls, no `AppConfig`, no `authSession`.

`components/marketing/EditorialChrome.tsx`:

- `ALogo()` — dot mark + "News Intelligence Studio".
- `ALangToggle({ language, t, onLanguageChange })` — EN · 中文 button pair
  using monospace styling. Not the same component as
  `components/LanguageToggle.tsx`; the editorial design uses different
  typography and a `·` separator.
- `AMasthead({ section?, language, t })` — date strip + section + edition.
- `ANav({ active, language, t, onLanguageChange })` — logo + four links
  + lang + Sign in + Open workspace. `active: "home" | "product" | "access"
  | "about"` flags the current link.
- `AFooter({ language, t })` — four-column footer. No Accuracy link.
- `ASectionHead({ eyebrow, title, italicTail?, aside? })`.

`components/marketing/EditorialMocks.tsx`:

- `EditorialBriefMock({ language, t })` — compact "Brief · <topic>" card
  with summary and five source-evidence rows. Used in Home hero. Reads from
  `marketingData.DEMO_BRIEF`.
- `EditorialAppMock({ language, t })` — full workspace mock (dark rail,
  composer, report grid, four-column section row). Used in Home tour and
  Product Fig. 1.

`components/marketing/EditorialIcons.tsx`:

- `PersonaGlyph({ value, color? })` — inline SVGs keyed by persona id
  (`research_analyst`, `financial_analyst`, `executive_brief`,
  `policy_intelligence`, `academic_researcher`, `risk_analyst`). Matches
  `personas.py`.
- `RailIcon({ kind: "search" | "bookmark" | "radio" })` — used in the
  `EditorialAppMock` rail.

Page components:

- `MarketingHome` — hero (deck + brief mock) → pipeline (six agents) →
  personas (six lenses) → tour (`EditorialAppMock`) → method steps (I–IV)
  → final CTA → footer.
- `MarketingProduct` — hero (deck + table of contents) → Fig. 1
  (`EditorialAppMock`) → five feature sections (Composer / Source ranking /
  Persona library / Evidence trail / Exports) → worked example (formula
  + score table) → coverage modes → local-first architecture → footer.
- `MarketingAccess` — hero → plan card + role table (viewer / analyst /
  admin with permission tags) + note → footer.
- `MarketingAbout` — hero → three principles → fact strip → CTAs → footer.

## Data

`frontend/src/marketingData.ts` mirrors the prototype's `data.js`:

```ts
export const PRODUCT = {
  name: "News Intelligence Studio",
  endpoint: "studio.local",
  edition: "Team A MVP · v0.14",
};

export const PIPELINE: PipelineAgent[];                  // 6 agents
export const PERSONAS:  PersonaLens[];                   // 6 lenses
export const SIGNALS:   RankingSignal[];                 // 3 weights (English defaults)
export const COVERAGE_MODES: CoverageMode[];             // auto / live / fallback
export const ROLES:     RoleSpec[];                      // viewer / analyst / admin
export const DEMO_BRIEF: DemoBrief;                      // from artifacts/brief-a017839f67/brief.json
```

`DEMO_BRIEF` includes: `brief_id`, `topic`, `persona`, `persona_label`,
`mode_used`, `section_generation_mode`, `executive_summary`,
`key_takeaways[]`, `key_facts[]`, `insights[]`, `uncertainties[]`,
`source_evidence[{n, src, cls, cred, fresh, fit, total}]`,
`confidence { score, rationale[] }`.

Chinese-localized fields for personas, signals, coverage modes, and roles
are derived inside components via `t()` lookups against `i18n.ts`. The data
module is English-canonical, matching the prototype.

## Types

`frontend/src/types.ts` gains the marketing-side interfaces: `DemoBrief`,
`DemoSourceEvidence`, `PipelineAgent`, `PersonaLens`, `RankingSignal`,
`CoverageMode`, `RoleSpec`.

## i18n

Keys added to both `english` and `chinese` dictionaries in `i18n.ts`:

- Chrome: `nav.home`, `nav.product`, `nav.access`, `nav.about`, `nav.signIn`,
  `nav.openWorkspace`, `mast.localFirst`, `mast.edition`, `foot.tagline`,
  `foot.builtAs`.
- Home: `home.eyebrow`, `home.title.a`, `home.title.b`, `home.deck`,
  `home.cta.workspace`, `home.cta.sample`, `home.byline`,
  `home.pipeline.eyebrow`, `home.pipeline.title.a`, `home.pipeline.title.b`,
  `home.personas.eyebrow`, `home.personas.title.a`, `home.personas.title.b`,
  `home.personas.aside`, `home.tour.eyebrow`, `home.tour.title.a`,
  `home.tour.title.b`, `home.steps.eyebrow`, `home.steps.title.a`,
  `home.steps.title.b`.
- Method steps: `step.compose`, `step.composeCopy`, `step.collect`,
  `step.collectCopy`, `step.reason`, `step.reasonCopy`, `step.export`,
  `step.exportCopy`.
- Figure caption: `fig.caption` (uses `{topic}`, `{persona}`, `{id}`).
- Product: a new `product.*` family covering hero, TOC, the five feature
  sections (composer/source/persona/evidence/exports), worked example,
  coverage modes, and local-first architecture, so the page renders from
  i18n only. Replaces the prototype's inline `zh ? ... : ...` ternaries.
- Access: `access.eyebrow`, `access.title.a`, `access.title.b`, `access.deck`,
  `access.plan`, `access.price`, `access.planCopy`, `access.rolesTitle`,
  `access.note`, and `access.plan.feature.*` for the four plan features.
- About: `about.eyebrow`, `about.title.a`, `about.title.b`, `about.deck`,
  `about.principles`, `about.p1`, `about.p1c`, `about.p2`, `about.p2c`,
  `about.p3`, `about.p3c`, and `about.fact.*` for the four fact-strip cells.
- Common: `common.default`, `common.example`.
- Roles, signals, coverage modes (English + Chinese label + blurb).

Keys removed:

- Every `marketing.*` and `marketing.pricing.*` key referenced only by the
  deleted `MarketingPages.tsx`. Verified by `rg "marketing\." frontend/src/`
  before deletion.

Helpers:

- `localizePersona(value, language)` is added to `i18n.ts`, mirroring the
  shape of the existing `localizeRole`. It returns
  `{ label, short }` per persona id, sourced from the same Chinese strings
  the prototype's `STUDIO_I18N.persona` uses.
- The existing `createTranslator` already supports `{token}` substitution
  (used by `error.requestFailed`); `fig.caption` and any other
  parameterised keys reuse it.

Style rule (from `Website UIUX/CLAUDE.md`): no em-dashes (—) in English
copy. The prototype already follows this. Any new English strings authored
here follow the same rule. The Chinese 破折号 (——) is correct and kept.

## Styling

The editorial design system is appended to `styles.css` under a `.a-root`
scope, ported from `Website UIUX/prod/chrome.jsx`. Every selector starts
with `.a-root` so the system cannot leak into the workspace, login,
or saved-brief templates.

Tokens (CSS custom properties under `.a-root`):

```css
--ab-ink, --ab-ink-soft, --ab-ink-mute
--ab-rule, --ab-rule-soft
--ab-paper, --ab-paper-2
--ab-accent, --ab-accent-ink
--ab-green, --ab-green-soft, --ab-green-deep
--ab-font-display, --ab-font-body, --ab-font-mono, --ab-font-italic
```

Class blocks (under `.a-root`):

- Typography: `.a-serif`, `.a-italic`, `.a-mono`, `.a-tabnum`, `.a-smallcaps`,
  `.a-rule`.
- Layout: `.a-container`, `.a-hero`, `.a-sec-head`.
- Components: `.a-btn`, `.a-btn-primary`, `.a-btn-ghost`, `.a-link`,
  `.a-mast`, `.a-mast-mid`, `.a-nav`, `.a-nav-logo`, `.a-nav-links`,
  `.a-nav-cta`, `.a-feat-grid`, `.a-feat`, `.a-feat-num`, `.a-steps`,
  `.a-step`, `.a-step-num`, `.a-screen`, `.a-screen-bar`, `.a-screen-dots`,
  `.a-cite`, `.a-foot`, `.a-foot-cols`, `.a-input`.
- Media queries at 1180px, 1100px, 980px, 680px (verbatim from the prototype).

Selectors removed from `styles.css` (deleted with `MarketingPages.tsx`),
each grep-verified to be referenced only by the old marketing surface
before removal:

- `.marketing-page`, `.marketing-nav`, `.marketing-brand`, `.marketing-hero`,
  `.marketing-hero-copy`, `.marketing-brief-preview`, `.marketing-preview-*`,
  `.marketing-actions`, `.marketing-band`, `.marketing-step`.
- `.pricing-hero`, `.pricing-layout`, `.pricing-plan`, `.pricing-plan-head`,
  `.pricing-note`.
- `.eyebrow`, `.primary-button`, `.secondary-button`, `.text-link-button`:
  removed only if grep confirms no workspace/login component uses them.
  If they are shared, they stay.

## Fonts

`frontend/index.html` gets a Google Fonts link inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,500;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
  rel="stylesheet"
/>
```

Four families and weights match the prototype. CDN fetch is acceptable for
marketing pages; the local-first promise applies to the workspace's Saved
mode (zero outbound brief generation), not to the public marketing surface.

## Verification

All gates must pass before the work is declared done.

| Gate                                                 | How                                          |
| ---------------------------------------------------- | -------------------------------------------- |
| `pytest -q` (from `team-a/mvp-v1/`)                  | Existing backend tests stay green.           |
| New `tests/test_marketing_routes.py` passes          | Each of `/product`, `/access`, `/about` returns 200 with the React shell; `/pricing` returns 404. |
| `npm run build` (in `frontend/`)                     | Vite produces `news_brief_mvp/static/react/` with no TS errors. |
| `./run_local.sh` boots                                | Uvicorn comes up; `/health` returns ok.      |
| `curl /` returns the React shell                     | Sanity check after the change.               |
| `curl /product`, `/access`, `/about`                 | Each returns the React shell.                |
| `curl /pricing`                                      | 404; the old route is gone.                  |
| Console clean                                        | No 404s on font requests; no missing-key warnings from `t()`. |
| `rg "marketing\." frontend/src/`                     | No matches after cleanup.                    |
| `rg "/pricing" frontend/src/ team-a/mvp-v1/news_brief_mvp/` | No matches after cleanup.             |

## Risks and mitigations

1. **Font CDN external dependency.** First marketing-page paint depends on
   Google Fonts. Mitigation: this is the same posture the prototype takes;
   we document it here. The workspace and Saved-mode briefs are unaffected.
2. **Design system isolation.** Every new selector starts with `.a-root` so
   it cannot affect the workspace. Mitigation: grep the new section before
   commit for any non-`.a-root` selectors.
3. **i18n key removal regression.** Removed keys that anything still references
   render as their literal id. Mitigation: `rg "marketing\." frontend/src/`
   after removal must return zero matches.
4. **Demo brief drift.** `marketingData.DEMO_BRIEF` is hand-typed from
   `artifacts/brief-a017839f67/brief.json` and may drift if the artifact
   changes. Mitigation: a comment in `marketingData.ts` records the artifact
   path; future updates re-sync from there.

## Open questions

None. All clarifying questions were resolved during brainstorming.
