from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_SRC = PROJECT_ROOT / "frontend" / "src"
EXPORT_CSS = PROJECT_ROOT / "news_brief_mvp" / "static" / "css" / "app.css"


def test_frontend_redesign_has_command_center_component_boundaries() -> None:
    expected_files = [
        "App.tsx",
        "i18n.ts",
        "types.ts",
        "components/AppShell.tsx",
        "components/LoginPage.tsx",
        "components/BriefComposer.tsx",
        "components/PersonaPicker.tsx",
        "components/BriefHistory.tsx",
        "components/BriefReport.tsx",
        "components/EmptyState.tsx",
        "components/LanguageToggle.tsx",
    ]

    missing_files = [
        relative_path
        for relative_path in expected_files
        if not (FRONTEND_SRC / relative_path).exists()
    ]

    assert missing_files == []

    main_entry = (FRONTEND_SRC / "main.tsx").read_text()
    assert "function App(" not in main_entry
    assert "createRoot" in main_entry


def test_frontend_redesign_uses_local_command_center_design_tokens() -> None:
    styles = (FRONTEND_SRC / "styles.css").read_text()
    export_styles = EXPORT_CSS.read_text()

    for token in ["--signal-green", "--vermilion", "--ink", "--paper"]:
        assert token in styles
        assert token in export_styles

    assert "font-family: Inter" not in styles
    assert "analyst-grid" in styles
    assert "evidence-meter" in styles
    assert "command-center" in export_styles


def test_profile_chip_opens_menu_with_logout_action() -> None:
    app_shell = (FRONTEND_SRC / "components" / "AppShell.tsx").read_text()
    styles = (FRONTEND_SRC / "styles.css").read_text()

    assert 'aria-haspopup="menu"' in app_shell
    assert 'aria-controls="profile-menu"' in app_shell
    assert 'id="profile-menu"' in app_shell
    assert 'role="menu"' in app_shell
    assert 't("profile.signOut")' in app_shell
    assert ".profile-dropdown" in styles


def test_profile_trigger_merges_role_and_initials() -> None:
    app_shell = (FRONTEND_SRC / "components" / "AppShell.tsx").read_text()
    styles = (FRONTEND_SRC / "styles.css").read_text()

    assert "profile-trigger-avatar" in app_shell
    assert app_shell.count('className="avatar-chip">{roleInitials}</span>') == 1
    assert ".profile-trigger-avatar" in styles


def test_side_rail_switches_between_workspace_views() -> None:
    app_shell = (FRONTEND_SRC / "components" / "AppShell.tsx").read_text()

    assert 'aria-label={t("nav.newBrief")}' in app_shell
    assert 'aria-label={t("nav.recentBriefs")}' in app_shell
    assert app_shell.count('className="rail-button"') == 2
    assert "Source evidence" not in app_shell
    assert "Signal watch" not in app_shell
    assert 'className="rail-logo" href="/"' not in app_shell
    assert 'className="rail-brand"' in app_shell
    assert 'className="rail-logo-mark"' in app_shell
    assert "scrollIntoView" not in app_shell
    assert 'onViewChange("briefing")' in app_shell
    assert 'onViewChange("history")' in app_shell
    assert 'aria-current={activeView === "briefing" ? "page" : undefined}' in app_shell
    assert 'aria-current={activeView === "history" ? "page" : undefined}' in app_shell


def test_coverage_select_label_stays_on_one_line() -> None:
    i18n = (FRONTEND_SRC / "i18n.ts").read_text(encoding="utf-8")
    styles = (FRONTEND_SRC / "styles.css").read_text()

    select_label_rule = styles.split(".select-shell span {", 1)[1].split("}", 1)[0]

    assert "display: inline-flex" in select_label_rule
    assert "align-items: center" in select_label_rule
    assert "white-space: nowrap" in select_label_rule
    assert '"composer.coverage": "Source mode"' in i18n
    assert '"composer.coverageAuto": "Balanced"' in i18n
    assert '"composer.coverageLive": "Live"' in i18n
    assert '"composer.coverageFallback": "Saved"' in i18n
    assert '"Balanced coverage"' not in i18n
    assert '"history.coverage": "Source mode"' in i18n


def test_login_page_uses_single_demo_workspace_entry() -> None:
    login_page = (FRONTEND_SRC / "components" / "LoginPage.tsx").read_text()

    assert 't("auth.enterWorkspace")' in login_page
    assert 't("auth.enterDemoWorkspace")' in login_page
    assert 't("auth.useApiKey")' in login_page
    assert "Choose operating role" not in login_page
    assert "login-role-grid" not in login_page
    assert "login-role-card" not in login_page


def test_source_rows_keep_citation_body_left_aligned() -> None:
    styles = (FRONTEND_SRC / "styles.css").read_text()

    source_row_rule = styles.split(".source-row {", 1)[1].split("}", 1)[0]

    assert "display: grid" in source_row_rule
    assert "grid-template-columns: 42px minmax(0, 1fr) auto" in source_row_rule
    assert "justify-content: stretch" in source_row_rule


def test_app_splits_briefing_and_history_views() -> None:
    app = (FRONTEND_SRC / "App.tsx").read_text()

    assert 'type AppView = "briefing" | "history"' in app
    assert "activeView === \"briefing\"" in app
    assert "activeView === \"history\"" in app
    assert "setActiveView(\"briefing\")" in app
    assert "<BriefHistory" in app
    assert "<RecentBriefs" not in app


def test_brief_history_page_supports_dense_history_and_delete_controls() -> None:
    app = (FRONTEND_SRC / "App.tsx").read_text()
    brief_history = (FRONTEND_SRC / "components" / "BriefHistory.tsx").read_text()

    assert "/api/briefs/history?limit=50" in app
    assert 'method: "DELETE"' in app
    assert 'className="history-page"' in brief_history
    assert 'className="history-table"' in brief_history
    assert 'className="history-row"' in brief_history
    assert "onOpenBrief" in brief_history
    assert "onDeleteBrief" in brief_history
    assert "canDelete" in brief_history
    assert "Trash2" in brief_history


def test_brief_history_page_uses_scrollable_dense_table() -> None:
    brief_history = (FRONTEND_SRC / "components" / "BriefHistory.tsx").read_text()
    styles = (FRONTEND_SRC / "styles.css").read_text()

    assert "history-table-shell" in brief_history
    assert "recent-expand-button" not in brief_history

    shell_rule = styles.split(".history-table-shell {", 1)[1].split("}", 1)[0]
    row_rule = styles.split(".history-row {", 1)[1].split("}", 1)[0]
    assert "overflow: auto" in shell_rule
    assert "overscroll-behavior: contain" in shell_rule
    assert "scrollbar-width: thin" in shell_rule
    assert "grid-template-columns:" in row_rule


def test_react_app_supports_english_and_chinese_language_toggle() -> None:
    i18n_path = FRONTEND_SRC / "i18n.ts"
    assert i18n_path.exists()

    i18n = i18n_path.read_text(encoding="utf-8")
    app = (FRONTEND_SRC / "App.tsx").read_text()
    app_shell = (FRONTEND_SRC / "components" / "AppShell.tsx").read_text()
    login_page = (FRONTEND_SRC / "components" / "LoginPage.tsx").read_text()

    assert 'export type Language = "en" | "zh"' in i18n
    assert 'DEFAULT_LANGUAGE: Language = "en"' in i18n
    assert "中文" in i18n
    assert "新闻情报工作台" in i18n
    assert "loadStoredLanguage" in app
    assert "document.documentElement.lang" in app
    assert "LanguageToggle" in app_shell
    assert "LanguageToggle" in login_page


def test_language_toggle_is_visible_in_main_topbar() -> None:
    app_shell = (FRONTEND_SRC / "components" / "AppShell.tsx").read_text()
    styles = (FRONTEND_SRC / "styles.css").read_text()

    assert 'className="top-language-switch"' in app_shell
    assert app_shell.find('className="top-language-switch"') < app_shell.find('className="profile-menu"')
    assert "profile-language-block" not in app_shell
    assert ".top-language-switch" in styles
