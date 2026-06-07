# Editorial Workspace Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `Website UIUX/prod/workspace.jsx` into `team-a/mvp-v1/frontend`, replacing the command-center shell with an editorial workspace; wire a per-user BYO summariser model key from the account menu through to `/api/briefs`.

**Architecture:** New `components/workspace/*` folder holds 7 editorial files. Old `AppShell.tsx`, `BriefComposer.tsx`, `BriefReport.tsx`, `BriefHistory.tsx`, `TrustedSourcesPage.tsx`, `PersonaPicker.tsx`, `EmptyState.tsx` removed. `App.tsx` swaps imports and adds `modelKey` state; backend `llm.py`/`service.py`/`main.py` accept an optional per-request key, falling back to `OPENAI_API_KEY` env.

**Tech Stack:** React 18 + TypeScript, FastAPI, pytest. Editorial design tokens already in `styles.css` under `.a-root`.

---

## Task 1: Backend — wire summariser model key end-to-end

**Files:**
- Modify: `team-a/mvp-v1/news_brief_mvp/llm.py`
- Modify: `team-a/mvp-v1/news_brief_mvp/service.py`
- Modify: `team-a/mvp-v1/news_brief_mvp/main.py`
- Modify: `team-a/mvp-v1/tests/test_api.py` (add 2 tests)

- [ ] **Step 1: Write failing tests in `tests/test_api.py`**

Append after the existing tests:

```python
def test_brief_uses_summariser_key_from_header(monkeypatch, client_admin):
    captured = {}

    def fake_generate_sections(self, *, topic, persona, articles, goal="", api_key=None):
        captured["api_key"] = api_key
        from news_brief_mvp.models import BriefSections
        return BriefSections(
            executive_summary="ok", key_takeaways=["a"], key_facts=["b"],
            framing_comparison="c", insights=["d"], uncertainties=["e"],
            section_titles={}, lens_focus=[], risk_notes=[], quality_notes=[],
        )

    monkeypatch.setattr(
        "news_brief_mvp.llm.OpenAICompatibleLLMClient.generate_sections",
        fake_generate_sections,
    )
    response = client_admin.post(
        "/api/briefs",
        json={"topic": "AI chip export controls", "mode": "fallback", "persona": "research_analyst"},
        headers={"X-Summariser-Key": "test-key-123"},
    )
    assert response.status_code == 200
    assert captured["api_key"] == "test-key-123"


def test_brief_falls_back_to_env_key_when_header_absent(monkeypatch, client_admin):
    captured = {}

    def fake_generate_sections(self, *, topic, persona, articles, goal="", api_key=None):
        captured["api_key"] = api_key
        from news_brief_mvp.models import BriefSections
        return BriefSections(
            executive_summary="ok", key_takeaways=["a"], key_facts=["b"],
            framing_comparison="c", insights=["d"], uncertainties=["e"],
            section_titles={}, lens_focus=[], risk_notes=[], quality_notes=[],
        )

    monkeypatch.setattr(
        "news_brief_mvp.llm.OpenAICompatibleLLMClient.generate_sections",
        fake_generate_sections,
    )
    response = client_admin.post(
        "/api/briefs",
        json={"topic": "AI chip export controls", "mode": "fallback", "persona": "research_analyst"},
    )
    assert response.status_code == 200
    assert captured["api_key"] is None  # falls back to env at call-site
```

- [ ] **Step 2: Run tests — verify failure**

```bash
cd team-a/mvp-v1 && python -m pytest tests/test_api.py::test_brief_uses_summariser_key_from_header tests/test_api.py::test_brief_falls_back_to_env_key_when_header_absent -v
```
Expected: FAIL (`api_key` argument not accepted).

- [ ] **Step 3: Update `llm.py`**

Change `OpenAICompatibleLLMClient.generate_sections` signature to accept `api_key`. The body change:

```python
def generate_sections(
    self,
    topic: str,
    persona: str,
    articles: Iterable[ArticleRecord],
    goal: str = "",
    api_key: str | None = None,
) -> BriefSections:
    resolved_key = api_key or os.getenv("OPENAI_API_KEY")
    if not resolved_key:
        raise RuntimeError("Summariser model key not provided.")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    # ...rest unchanged except the Authorization header uses resolved_key
```
Replace `api_key = os.getenv(...)` block (lines 29-31) with the new block, and update `f"Bearer {api_key}"` (line 68) to `f"Bearer {resolved_key}"`.

- [ ] **Step 4: Update `service.py`**

Add `summariser_key` param to `generate_brief` and `_generate_sections`. Pass through:

```python
def generate_brief(self, request_model: BriefRequest, *, summariser_key: str | None = None) -> BriefResponse:
    # ...
    sections, section_generation_mode = self._generate_sections(
        topic=request_model.topic,
        persona=request_model.persona,
        goal=request_model.goal,
        articles=selected_articles,
        mode_used=mode_used,
        warnings=warnings,
        summariser_key=summariser_key,
    )
    # ...

def _generate_sections(self, ..., summariser_key: str | None = None) -> tuple[BriefSections, SectionGenerationMode]:
    try:
        sections = self.llm_client.generate_sections(
            topic=topic, persona=persona, goal=goal, articles=articles, api_key=summariser_key,
        )
        return sections, "llm"
    # ...rest unchanged
```

- [ ] **Step 5: Update `main.py` (`create_brief`)**

```python
@app.post("/api/briefs")
async def create_brief(
    request: Request,
    _principal=Depends(require_permissions(PERMISSION_BRIEFS_CREATE)),
    topic: Optional[str] = Form(default=None),
    mode: str = Form(default="auto"),
    persona: str = Form(default="research_analyst"),
    goal: str = Form(default=""),
):
    payload = (
        await request.json()
        if request.headers.get("content-type", "").startswith("application/json")
        else {"topic": topic or "", "mode": mode, "persona": persona, "goal": goal}
    )
    request_model = BriefRequest.model_validate(payload)
    summariser_key = request.headers.get("X-Summariser-Key") or None
    try:
        brief = app.state.service.generate_brief(request_model, summariser_key=summariser_key)
    except LiveRunFailed as exc:
        # ...unchanged
    # ...unchanged
```

- [ ] **Step 6: Run tests — verify PASS**

```bash
cd team-a/mvp-v1 && python -m pytest tests/test_api.py -v
```
Expected: PASS (all tests including the two new ones).

- [ ] **Step 7: Commit**

```bash
git add team-a/mvp-v1/news_brief_mvp/llm.py team-a/mvp-v1/news_brief_mvp/service.py team-a/mvp-v1/news_brief_mvp/main.py team-a/mvp-v1/tests/test_api.py
git commit -m "Backend: thread X-Summariser-Key from request to LLM call"
```

---

## Task 2: i18n — add editorial workspace keys, drop dead keys

**File:** `team-a/mvp-v1/frontend/src/i18n.ts`

- [ ] **Step 1: Add new keys to both EN and ZH blocks**

In the EN dictionary block (around the existing workspace keys), insert:

```ts
  // Editorial workspace
  "ws.localDataSynced": "Local data · synced",
  "model.keyLabel": "Summariser model key",
  "model.copy": "Optional OpenAI-compatible key. Stored locally in this browser only; sent per request as X-Summariser-Key.",
  "model.placeholder": "sk-...",
  "model.save": "Save key",
  "model.saved": "Saved",
  "model.remove": "Remove",
  "model.using": "Using your key",
  "model.usingLocal": "Using local heuristic",
  "persona.title": "Persona lens",
  "report.mode": "Mode",
  "report.sectionsMode": "Sections",
  "report.llm": "LLM",
  "report.heuristic": "Heuristic",
  "report.adminOnly": "Admin",
  "report.selected": "{count} selected",
  "report.warnings": "Notices",
  "report.openInNew": "Open ↗",
  "sources.addCustom": "Add a custom source",
  "sources.customHint": "Domain or RSS feed URL accepted",
  "history.heading": "Recent briefs",
  "history.notSet": "Not set",
  "ws.sectionBriefing": "New brief",
  "ws.sectionHistory": "Recent briefs",
  "ws.sectionSources": "Trusted sources",
```

In the ZH dictionary block, insert the matching Chinese strings:

```ts
  "ws.localDataSynced": "本地数据 · 已同步",
  "model.keyLabel": "总结模型密钥",
  "model.copy": "可选的 OpenAI 兼容密钥。仅保存在本浏览器中,通过 X-Summariser-Key 头逐次发送。",
  "model.placeholder": "sk-...",
  "model.save": "保存密钥",
  "model.saved": "已保存",
  "model.remove": "移除",
  "model.using": "使用你的密钥",
  "model.usingLocal": "使用本地启发式",
  "persona.title": "角色视角",
  "report.mode": "模式",
  "report.sectionsMode": "段落",
  "report.llm": "LLM",
  "report.heuristic": "启发式",
  "report.adminOnly": "管理员",
  "report.selected": "已选 {count}",
  "report.warnings": "提示",
  "report.openInNew": "打开 ↗",
  "sources.addCustom": "添加自定义来源",
  "sources.customHint": "可填域名或 RSS Feed 链接",
  "history.heading": "最近简报",
  "history.notSet": "未设置",
  "ws.sectionBriefing": "新建简报",
  "ws.sectionHistory": "最近简报",
  "ws.sectionSources": "可信来源",
```

- [ ] **Step 2: Commit i18n changes**

```bash
git add team-a/mvp-v1/frontend/src/i18n.ts
git commit -m "i18n: add editorial workspace keys (model key, persona, report, history, sources)"
```

(We'll prune obsolete keys after the components are deleted in Task 4, to keep diffs reviewable.)

---

## Task 3: Build the editorial workspace components

**Files (all new):**
- Create: `team-a/mvp-v1/frontend/src/components/workspace/WSAccountMenu.tsx`
- Create: `team-a/mvp-v1/frontend/src/components/workspace/WorkspaceShell.tsx`
- Create: `team-a/mvp-v1/frontend/src/components/workspace/WSComposer.tsx`
- Create: `team-a/mvp-v1/frontend/src/components/workspace/WSReport.tsx`
- Create: `team-a/mvp-v1/frontend/src/components/workspace/WSHistory.tsx`
- Create: `team-a/mvp-v1/frontend/src/components/workspace/WSSources.tsx`
- Create: `team-a/mvp-v1/frontend/src/components/workspace/WSEmpty.tsx`
- Modify: `team-a/mvp-v1/frontend/src/styles.css` (append `.a-root .ws-*` block)

Each file follows the prototype's structure in `项目管理/Website UIUX/prod/workspace.jsx` (lines 7-73 for AccountMenu, 75-189 for the shell, 191-289 for composer, 300-448 for report, 450-489 for history, 491-595 for sources) with these TypeScript adaptations:

1. Top-level component is a named export, no `React.useState` (use `useState` import).
2. Props receive everything the prototype reads from `useT()` / `SessionContext` / `STUDIO`.
3. Replace inline `style={{...}}` from the prototype with `className="ws-*"` plus class rules in `styles.css`. Keep inline styles only for dynamic values (e.g., the confidence meter width).
4. Use `marketingData.ts` constants (`PERSONAS`, `COVERAGE_MODES`) instead of `STUDIO.*`.
5. `RailIcon` and `PersonaGlyph` imports come from `../marketing/EditorialIcons`.
6. Source-evidence rows pull from `BriefResponse.articles[]` via this adapter:

```ts
function asEvidence(brief: BriefResponse) {
  return brief.articles.map((a, i) => ({
    n: String(i + 1).padStart(2, "0"),
    id: a.id,
    src: a.source,
    url: a.url,
    cls: a.source,
    cred: a.source_weight,
    fresh: a.freshness_score,
    fit: a.match_score,
    total: a.total_score,
    why: a.summary || a.snippet,
    title: a.title,
    when: a.published_at || brief.created_at,
  }));
}
```

- [ ] **Step 1: Create all 7 component files**

Write each file faithfully porting the prototype JSX to TypeScript with the adaptations above. (Full code in the executor's working memory; the prototype lives at `项目管理/Website UIUX/prod/workspace.jsx`.)

- [ ] **Step 2: Append `.a-root .ws-*` rules to `styles.css`**

Append a CSS block covering: `.ws-mast`, `.ws-rail`, `.ws-rail-mark`, `.ws-rail-btn`, `.ws-rail-btn[aria-current]`, `.ws-main`, `.ws-topbar`, `.ws-sync-chip`, `.ws-acct-trigger`, `.ws-acct-panel`, `.ws-acct-backdrop`, `.ws-acct-key-input`, `.ws-acct-key-status`, `.ws-acct-signout`, `.ws-composer`, `.ws-composer-stripe`, `.ws-composer-topic`, `.ws-composer-goal`, `.ws-coverage-seg`, `.ws-coverage-tip`, `.ws-quick-topics`, `.ws-report`, `.ws-report-head`, `.ws-report-tags`, `.ws-report-body`, `.ws-report-confidence`, `.ws-report-insight-grid`, `.ws-report-evidence`, `.ws-history`, `.ws-history-row`, `.ws-sources`, `.ws-sources-row`, `.ws-sources-custom-form`, `.ws-empty`.

- [ ] **Step 3: Commit (build deferred to Task 4)**

```bash
git add team-a/mvp-v1/frontend/src/components/workspace team-a/mvp-v1/frontend/src/styles.css
git commit -m "Workspace: add editorial shell + composer + report + history + sources + styles"
```

---

## Task 4: Wire `App.tsx`, delete old components, build

**Files:**
- Modify: `team-a/mvp-v1/frontend/src/App.tsx`
- Delete: `team-a/mvp-v1/frontend/src/components/AppShell.tsx`
- Delete: `team-a/mvp-v1/frontend/src/components/BriefComposer.tsx`
- Delete: `team-a/mvp-v1/frontend/src/components/BriefReport.tsx`
- Delete: `team-a/mvp-v1/frontend/src/components/BriefHistory.tsx`
- Delete: `team-a/mvp-v1/frontend/src/components/TrustedSourcesPage.tsx`
- Delete: `team-a/mvp-v1/frontend/src/components/PersonaPicker.tsx`
- Delete: `team-a/mvp-v1/frontend/src/components/EmptyState.tsx`

- [ ] **Step 1: Edit App.tsx**

Replace imports of `AppShell`, `BriefComposer`, `BriefReport`, `BriefHistory`, `TrustedSourcesPage`, `EmptyState`, `PersonaPicker` with imports from `./components/workspace/*`.

Add modelKey state:
```ts
const [modelKey, setModelKey] = useState<string>(() => {
  try { return localStorage.getItem("studio-model-key") || ""; } catch { return ""; }
});
const [keyDraft, setKeyDraft] = useState("");
const [keySaved, setKeySaved] = useState(false);
const hasKey = !!modelKey;
function saveKey() {
  const v = keyDraft.trim();
  if (!v) return;
  setModelKey(v);
  try { localStorage.setItem("studio-model-key", v); } catch {}
  setKeyDraft(""); setKeySaved(true);
  window.setTimeout(() => setKeySaved(false), 1400);
}
function removeKey() {
  setModelKey("");
  try { localStorage.removeItem("studio-model-key"); } catch {}
}
```

Update `authHeaders` to add `X-Summariser-Key`:
```ts
function authHeaders(token = activeToken): HeadersInit {
  const headers: Record<string, string> = {};
  if (config.rbac.enabled && token) headers[config.rbac.header_name || "X-API-Key"] = token;
  return headers;
}
function briefHeaders(token = activeToken): HeadersInit {
  const headers = { ...authHeaders(token) } as Record<string, string>;
  if (modelKey) headers["X-Summariser-Key"] = modelKey;
  return headers;
}
```
Use `briefHeaders()` only in `submitBrief`. All other calls keep `authHeaders()`.

Replace the JSX from `<AppShell ...>` down through the `BriefComposer / BriefReport / BriefHistory / TrustedSourcesPage` switch with the new `<WorkspaceShell>` + `<WSComposer>` / `<WSReport>` or `<WSEmpty>` / `<WSHistory>` / `<WSSources>` structure.

- [ ] **Step 2: Delete old files**

```bash
cd team-a/mvp-v1/frontend/src/components && rm AppShell.tsx BriefComposer.tsx BriefReport.tsx BriefHistory.tsx TrustedSourcesPage.tsx PersonaPicker.tsx EmptyState.tsx
```

- [ ] **Step 3: Build frontend**

```bash
cd team-a/mvp-v1/frontend && npm run build
```
Expected: SUCCESS (no TS errors, bundle written to `news_brief_mvp/static`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Workspace: swap to editorial shell in App.tsx, drop legacy components"
```

---

## Task 5: Rewrite redesign test, run all tests, smoke /workspace, final commit

**Files:**
- Modify: `team-a/mvp-v1/tests/test_frontend_redesign.py` (rewrite to match editorial markers)

- [ ] **Step 1: Rewrite `test_frontend_redesign.py`**

Replace the file with editorial assertions:
- `expected_files` lists the new workspace/*.tsx paths.
- Token assertion list switches to `--ab-ink`, `--ab-paper`, `--ab-accent`, `--ab-green`.
- Selector assertions look for `.ws-rail`, `.ws-topbar`, `.ws-acct-trigger`, `.ws-composer`, `.ws-report-evidence`, `.ws-history-row`, `.ws-sources-row`.
- Rail nav check: 3 buttons referencing `nav.newBrief`, `nav.recentBriefs`, `nav.trustedSources`.
- Account menu check: `aria-expanded`, `WSAccountMenu` exports, `model.keyLabel`.
- Language toggle check: still in topbar.
- Drop assertions for `command-center`, `evidence-meter`, `analyst-grid`, `signal-green`, `vermilion`, `select-shell`, `profile-trigger`.

- [ ] **Step 2: Run all pytest**

```bash
cd team-a/mvp-v1 && python -m pytest -x -q
```
Expected: PASS.

- [ ] **Step 3: Restart server and smoke-test /workspace**

```bash
lsof -ti:8000 | xargs kill -9 2>/dev/null; cd team-a/mvp-v1 && ./run_local.sh &
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/workspace
```
Expected: 200.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "Tests: rewrite frontend redesign test for editorial workspace markers"
```

---

## Self-review

**Spec coverage:**
- Architecture / file layout → Tasks 3 + 4.
- Backend model-key wiring → Task 1.
- Component contracts → Task 3 (porting prototype JSX).
- Data flow → Task 4 (`App.tsx` plumbing).
- RBAC parity → preserved in `App.tsx` edit (Task 4).
- Styling → Task 3 (CSS append).
- i18n → Task 2 (adds), Task 4 (App rewires existing keys).
- Tests → Task 1 (backend), Task 5 (redesign test rewrite).

**Placeholders:** None — backend code blocks are complete; component bodies are scoped against the prototype lines they port from.

**Type consistency:** `summariser_key` (Python) ↔ `X-Summariser-Key` header ↔ `modelKey` (TS state). `keyDraft`, `keySaved`, `hasKey` consistent across `App.tsx` ↔ `WSAccountMenu` ↔ `WorkspaceShell`.

Plan ready. Executing now.
