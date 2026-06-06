# Editorial workspace port — design

Port the editorial workspace design from `Website UIUX/prod/workspace.jsx` into
`team-a/mvp-v1`, keeping the live FastAPI backend and RBAC behavior intact, and
adding a BYO summariser model key wired from the account menu through to the
LLM call.

## Goals

1. Replace the current "command center" workspace shell, composer, report,
   history, and trusted-sources views with editorial versions that match the
   prototype's typography, palette, and layout.
2. Preserve all live API behavior: `/api/config`, `/api/briefs`, `/api/briefs/*`,
   `/api/trusted-sources`, RBAC headers, autosave, error banners.
3. Add a per-user summariser model key (OpenAI-compatible) that lives in the
   account menu, persists to `localStorage`, ships on `/api/briefs` as
   `X-Summariser-Key`, and overrides the server `OPENAI_API_KEY` when present.
4. Keep the marketing pages and login page untouched.

## Non-goals

- No change to marketing routes (`/`, `/product`, `/access`, `/about`).
- No change to `LoginPage.tsx`, FastAPI auth, or any export route
  (`/briefs/:id/export*`, `/briefs/:id/handoff`).
- No rewrite of `i18n.ts` — we add ~25 keys, rename none.
- No new design tokens — the `.a-root` editorial palette in `styles.css` is the
  source of truth.

## Architecture

### Routing
`App.tsx` already routes `/workspace` to the authenticated workspace shell. The
port keeps that routing; only the rendered shell + views change.

### Frontend file layout
New folder: `frontend/src/components/workspace/`.

| File | ~LOC | Responsibility |
|---|---|---|
| `WorkspaceShell.tsx` | 140 | Thin top masthead band + dark left rail + topbar slot. Owns `activeView`, language, account-menu trigger. Renders `children`. |
| `WSAccountMenu.tsx` | 95 | Identity card + summariser key input (save / remove / status dot) + sign out. Owns `open` state. |
| `WSComposer.tsx` | 150 | Topic input with green ring, goal pill, persona 6-up grid (uses `PersonaGlyph`), coverage segmented control with hover tooltips, quick topics, error banner. |
| `WSReport.tsx` | 200 | Mode + heuristic/llm badges, header meta row, two-column body (summary + warnings \| confidence sidebar), 4-column insight grid, coverage note, source-evidence list with 01..N kicker. |
| `WSHistory.tsx` | 75 | Editorial grid table. |
| `WSSources.tsx` | 160 | Editorial grid catalog table, autosave chip in header, custom-source form. |
| `WSEmpty.tsx` | 30 | Editorial empty state for "no brief yet". |

Files deleted (replaced):
- `components/AppShell.tsx`
- `components/BriefComposer.tsx`
- `components/BriefReport.tsx`
- `components/BriefHistory.tsx`
- `components/TrustedSourcesPage.tsx`
- `components/PersonaPicker.tsx`
- `components/EmptyState.tsx`

Files touched (small edits, not rewrites):
- `App.tsx` — swap component imports; add `modelKey` + `setModelKey` state,
  persist to `localStorage`, send as `X-Summariser-Key` on `POST /api/briefs`.
  Routing, login, RBAC unchanged.
- `i18n.ts` — append ~25 keys (account / model key / coverage tooltips / persona
  helper / report sub-labels). No renames.
- `styles.css` — append a `.a-root` workspace block (dark-rail, topbar, composer
  sections, report grid, history grid, sources grid, account-menu dropdown).
  Marketing-only styles untouched.

### Backend file changes
- `news_brief_mvp/main.py` (`create_brief` handler) — read
  `request.headers.get("X-Summariser-Key")`, pass to
  `service.generate_brief(request_model, summariser_key=…)`.
- `news_brief_mvp/service.py` (`BriefService.generate_brief`,
  `_generate_sections`) — accept optional `summariser_key`, forward to
  `llm_client.generate_sections(api_key=…)`.
- `news_brief_mvp/llm.py` (`OpenAICompatibleLLMClient.generate_sections`) —
  accept optional `api_key` argument; prefer it over `os.getenv("OPENAI_API_KEY")`;
  no other behavior change.

## Component contracts

### `<WorkspaceShell>`

```ts
type Props = {
  activeView: "briefing" | "history" | "sources";
  language: Language;
  t: TFunction;
  roleLabel: string;
  accountName: string;       // session.email.split("@")[0] or roleLabel fallback
  modelKey: string;          // current saved key (read-only here)
  keyDraft: string;          // input draft
  keySaved: boolean;         // 1.4 s "saved" flash
  rbacEnabled: boolean;      // hides sign-out item if false (parity w/ today)
  onViewChange: (v) => void;
  onLanguageChange: (l) => void;
  onKeyDraftChange: (v) => void;
  onSaveKey: () => void;
  onRemoveKey: () => void;
  onLogout: () => void;
  children: ReactNode;
};
```

Visual contract:
- Thin top band (`.a-mast` equivalent, scoped `.ws-mast`): date · section label · sync chip.
- Left rail 84px wide, `var(--ab-ink)` background, 3 icon-and-label buttons
  (Briefing, History, Sources) using `RailIcon`; active item gets soft-green
  background and white border tint per the prototype.
- Topbar (`.ws-topbar`) inside the main column: small-caps section eyebrow + product name on the left;
  language toggle + account-menu trigger on the right.

### `<WSAccountMenu>`

Trigger button: rounded pill with account name + role chip + ink-filled avatar.
On open, fixed-overlay backdrop closes the menu. Dropdown panel contains:
- Identity card: 36 px avatar, name, role line.
- Model key block: small-caps label, copy line, password input, save button
  (primary), remove button (when `hasKey`), status dot ("Using local
  heuristic" vs "Using your key").
- Sign-out row (hidden when `rbacEnabled === false`, matching today's
  `AppShell` behavior).

### `<WSComposer>`

Owns no state; receives all values + callbacks. Reuses today's `topic`, `goal`,
`mode`, `persona` props from `App`. Adds:
- `quickTopics` array driven by language (EN / ZH).
- `hoverMode` local state for tooltip target.
- Submit button gated by `canGenerate` (matches today's `RBAC` rule).

### `<WSReport>`

Inputs: the existing `BriefResponse` type. Adds two computed maps:
- `evidenceItems` — adapt `brief.articles[]` to the prototype's
  `source_evidence` shape (number 01..N, src, url, cls = source/category line,
  fresh, fit, total, why, title, when).
- Section titles still come from `brief.section_titles`; the editorial
  small-caps headers use the existing localized fallbacks.

Behavior parity:
- Show heuristic warning banner only when `brief.warnings` includes
  `"llm_generation_failed"` OR (no model key AND not fallback). The prototype
  shows it when `!hasKey`; we tighten to "actually heuristic this run" so a
  user who didn't save a key but got an LLM brief (server-side env key set) is
  not falsely warned.

### `<WSHistory>` and `<WSSources>`

Same props as today's `BriefHistory` and `TrustedSourcesPage`. Internals
re-render with editorial grid layouts. `WSSources` adds an autosave chip in
the header (driven by today's `isSaving`).

## Data flow

```
App ─┬── auth / config / brief / history / sources / modelKey  (state)
     │
     ├─→ WorkspaceShell ─┬─→ (mast / rail / topbar / WSAccountMenu)
     │                    └─→ children
     │
     ├─→ WSComposer ─→ POST /api/briefs (with X-Summariser-Key)
     ├─→ WSReport   ─→ reads brief, no fetches
     ├─→ WSHistory  ─→ GET / DELETE /api/briefs[/:id]
     └─→ WSSources  ─→ GET / PUT  /api/trusted-sources
```

`modelKey` lives in `App` (single source), loaded from `localStorage` on
mount and persisted on `save` / cleared on `remove`. `submitBrief` reads
`modelKey` and adds `X-Summariser-Key: <key>` to the request headers.

## Model-key wiring (end-to-end)

**Frontend**

```ts
// App.tsx (excerpt)
const [modelKey, setModelKey] = useState<string>(
  () => localStorage.getItem("studio-model-key") || ""
);
function authHeaders(): HeadersInit {
  const h: Record<string, string> = {};
  if (config.rbac.enabled && activeToken) h[config.rbac.header_name] = activeToken;
  if (modelKey) h["X-Summariser-Key"] = modelKey;
  return h;
}
```

**Backend**

```python
# main.py — create_brief
summariser_key = request.headers.get("X-Summariser-Key") or None
brief = app.state.service.generate_brief(request_model, summariser_key=summariser_key)
```

```python
# service.py
def generate_brief(self, request_model, *, summariser_key: str | None = None):
    ...
    sections, mode = self._generate_sections(..., summariser_key=summariser_key)

def _generate_sections(self, *, summariser_key=None, ...):
    try:
        sections = self.llm_client.generate_sections(..., api_key=summariser_key)
        return sections, "llm"
    except Exception:
        ...
```

```python
# llm.py
def generate_sections(self, ..., api_key: str | None = None):
    api_key = api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Summariser model key not provided.")
    ...
```

Security: the key is never logged, never persisted server-side, never echoed
in responses. It rides one request and is dropped.

## RBAC and gating (unchanged)

The port keeps today's role checks:
- `canGenerate = role !== "viewer"` — disables the Generate button.
- `canManageTrustedSources = role === "admin" || role === "analyst"` — disables
  checkboxes and the custom-source form.
- `canDeleteBriefs = role === "admin"` — disables the Delete button.
- `canHandoff = role === "admin"` — gates the JSON handoff link in the export
  row of `WSReport`.

## Styling notes

All new styles live in `styles.css` under selectors like `.a-root .ws-*`,
appended after the existing marketing block. Rules use existing tokens:
`--ab-ink`, `--ab-paper`, `--ab-paper-2`, `--ab-rule`, `--ab-rule-soft`,
`--ab-accent`, `--ab-green`, `--ab-green-soft`, `--ab-green-deep`,
`--ab-ink-soft`, `--ab-ink-mute`, plus the existing font variables.

Sticky behavior: the masthead band is **not** sticky (the prototype's isn't);
the rail and topbar form a fixed two-axis frame (rail full height, topbar
sticky inside the main column). Scrolling happens inside the inner content
area only.

## i18n additions

Reuse existing keys wherever possible:
- Rail labels: `nav.newBrief`, `nav.recentBriefs`, `nav.trustedSources`.
- Sync chip: `app.localDataSynced`.
- Sign out: `profile.signOut`.
- Coverage tooltips: `coverage.{auto,live,fallback}.{label,flow,blurb}` already
  populated for marketing; the workspace tooltip body reuses `blurb`, the
  segmented control's chip uses `label`, and the tooltip footnote uses `flow`.
- Persona helper: `persona.helper` already exists.
- Composer: `composer.coverage`, `composer.coverageAuto/Live/Fallback`,
  `composer.topicPlaceholder`, `composer.goalPlaceholder`,
  `composer.quickTopics`, `composer.generate`, `composer.generating` exist.

Truly new keys (~18, each in both EN and ZH):

| Namespace | Keys |
|---|---|
| `model.*` | `keyLabel`, `copy`, `placeholder`, `save`, `saved`, `remove`, `using`, `usingLocal` |
| `persona.*` | `title` (the "Persona lens" section heading) |
| `report.*` | `mode`, `sectionsMode`, `llm`, `heuristic`, `adminOnly`, `selected`, `warnings` |
| `sources.*` | `addCustom`, `customHint` |

Drop-on-cleanup (only used by deleted components): `app.commandCenter`,
`profile.session`, `profile.roleDetails`, `profile.roleHint`,
`composer.controls`, `composer.title`, `composer.copy`, `composer.sourceSync`,
`composer.topicLabel`, `nav.primary`, `nav.workspace`, `history.tableLabel`,
`recent.savedBrief`, `recent.deleteAria`, `recent.deleteTitle`,
`sources.formTitle`, `sources.feedReady`, `sources.subscriptionNote`,
`sources.globalPreference`, `sources.catalog`, `sources.custom`,
`sources.customHelp`, `sources.namePlaceholder`, `sources.domainPlaceholder`,
`sources.feedPlaceholder`, `sources.category`, `sources.selectedCount`,
`sources.noCustomSources`, `error.deleteConfirm`. (We'll grep each before
removing, in EN and ZH blocks both.)

## Tests

### Backend (pytest)
- `tests/test_api.py::test_brief_uses_summariser_key_header` — assert that a
  request carrying `X-Summariser-Key: test-key` causes the LLM client to be
  called with that key (monkeypatch `OpenAICompatibleLLMClient.generate_sections`
  to capture `api_key`).
- `tests/test_api.py::test_brief_falls_back_to_env_key` — assert that without
  the header, `os.getenv("OPENAI_API_KEY")` is the source.
- Existing tests for routes and storage continue to pass unchanged.

### Frontend smoke tests (existing redesign test)
- Update `tests/test_frontend_redesign.py` to reference new component paths and
  to assert the editorial workspace markers (`<aside class="ws-rail">`,
  `.ws-topbar`, etc.) are present on `/workspace`.

## Risks and rollback

- **Risk**: A subtle regression in the live-API path because we replaced every
  workspace component. **Mitigation**: keep the data shape exactly as
  `BriefResponse`; do not change `App.tsx`'s submit/load/delete handlers
  except to thread the model key.
- **Risk**: The model-key header is honored only by the brief route. **Scope**:
  trusted-sources, history, login, and exports use the existing token-only
  auth as today.
- **Rollback**: `git revert` of the porting commit returns the
  command-center workspace; no migrations or persisted data shape changed.

## Out of scope (explicit)

- Animated transitions.
- A "dark mode" variant of the workspace (the prototype is single-theme).
- Wider source-evidence rows for tablet — desktop layout only, matching today.
- Server-side caching or rate-limiting of the model-key route.
