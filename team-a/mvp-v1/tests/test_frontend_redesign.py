from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_SRC = PROJECT_ROOT / "frontend" / "src"
EXPORT_CSS = PROJECT_ROOT / "news_brief_mvp" / "static" / "css" / "app.css"


def test_frontend_redesign_has_command_center_component_boundaries() -> None:
    expected_files = [
        "App.tsx",
        "types.ts",
        "components/AppShell.tsx",
        "components/LoginPage.tsx",
        "components/BriefComposer.tsx",
        "components/PersonaPicker.tsx",
        "components/RecentBriefs.tsx",
        "components/BriefReport.tsx",
        "components/EmptyState.tsx",
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
    assert "Sign out" in app_shell
    assert ".profile-dropdown" in styles


def test_profile_trigger_merges_role_and_initials() -> None:
    app_shell = (FRONTEND_SRC / "components" / "AppShell.tsx").read_text()
    styles = (FRONTEND_SRC / "styles.css").read_text()

    assert "profile-trigger-avatar" in app_shell
    assert app_shell.count('className="avatar-chip">{roleInitials}</span>') == 1
    assert ".profile-trigger-avatar" in styles


def test_coverage_select_label_stays_on_one_line() -> None:
    styles = (FRONTEND_SRC / "styles.css").read_text()

    select_label_rule = styles.split(".select-shell span {", 1)[1].split("}", 1)[0]

    assert "display: inline-flex" in select_label_rule
    assert "align-items: center" in select_label_rule
    assert "white-space: nowrap" in select_label_rule
