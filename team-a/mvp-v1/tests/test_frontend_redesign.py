from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_SRC = PROJECT_ROOT / "frontend" / "src"


def test_editorial_workspace_component_files_exist() -> None:
    expected_files = [
        "App.tsx",
        "i18n.ts",
        "types.ts",
        "components/LoginPage.tsx",
        "components/LanguageToggle.tsx",
        "components/workspace/WorkspaceShell.tsx",
        "components/workspace/WSAccountMenu.tsx",
        "components/workspace/WSComposer.tsx",
        "components/workspace/WSReport.tsx",
        "components/workspace/WSHistory.tsx",
        "components/workspace/WSSources.tsx",
        "components/workspace/WSEmpty.tsx",
        "components/marketing/MarketingHome.tsx",
        "components/marketing/MarketingProduct.tsx",
        "components/marketing/MarketingAccess.tsx",
        "components/marketing/MarketingAbout.tsx",
        "components/marketing/EditorialChrome.tsx",
        "components/marketing/EditorialIcons.tsx",
        "components/marketing/EditorialMocks.tsx",
        "marketingData.ts",
    ]
    missing = [p for p in expected_files if not (FRONTEND_SRC / p).exists()]
    assert missing == [], f"Missing files: {missing}"


def test_old_workspace_components_are_removed() -> None:
    removed_files = [
        "components/AppShell.tsx",
        "components/BriefComposer.tsx",
        "components/BriefHistory.tsx",
        "components/BriefReport.tsx",
        "components/EmptyState.tsx",
        "components/PersonaPicker.tsx",
        "components/TrustedSourcesPage.tsx",
    ]
    still_present = [p for p in removed_files if (FRONTEND_SRC / p).exists()]
    assert still_present == [], f"Old components still present: {still_present}"


def test_workspace_shell_has_dark_rail_and_three_views() -> None:
    shell = (FRONTEND_SRC / "components" / "workspace" / "WorkspaceShell.tsx").read_text()
    assert 'aria-label={p.t("nav.workspace")}' in shell
    assert 't("ws.sectionBriefing")' in shell
    assert 't("ws.sectionHistory")' in shell
    assert 't("ws.sectionSources")' in shell
    assert "WSAccountMenu" in shell
    assert "LanguageToggle" in shell
    assert "var(--ab-ink)" in shell
    assert "var(--ab-green)" in shell


def test_account_menu_has_summariser_key_input() -> None:
    menu = (FRONTEND_SRC / "components" / "workspace" / "WSAccountMenu.tsx").read_text()
    assert 't("model.keyLabel")' in menu
    assert 't("model.save")' in menu
    assert 't("model.remove")' in menu
    assert 't("model.using")' in menu
    assert 't("model.usingLocal")' in menu
    assert 'type="password"' in menu
    assert 'autoComplete="off"' in menu


def test_app_passes_model_key_state_to_workspace_shell() -> None:
    app = (FRONTEND_SRC / "App.tsx").read_text()
    assert 'localStorage.getItem("studio-model-key")' in app
    assert 'localStorage.setItem("studio-model-key"' in app
    assert "briefHeaders" in app
    assert '"X-Summariser-Key"' in app
    assert "<WorkspaceShell" in app
    assert "<WSComposer" in app
    assert "<WSHistory" in app
    assert "<WSSources" in app
    assert "<WSReport" in app
    assert "<WSEmpty" in app


def test_editorial_workspace_keeps_marketing_routes_intact() -> None:
    app = (FRONTEND_SRC / "App.tsx").read_text()
    # AppRoute union covers marketing pages, login, workspace views, and brief detail.
    # Asserted variant-by-variant so cosmetic reformatting of the union doesn't
    # flake this test.
    for variant in (
        '"home"',
        '"product"',
        '"access"',
        '"about"',
        '"login"',
        '"workspace"',
        '"workspaceHistory"',
        '"workspaceSources"',
        '"briefDetail"',
    ):
        assert variant in app, f"AppRoute missing {variant} variant"
    assert "MarketingHome" in app
    assert "MarketingProduct" in app
    assert "MarketingAccess" in app
    assert "MarketingAbout" in app


def test_workspace_uses_a_root_design_tokens() -> None:
    styles = (FRONTEND_SRC / "styles.css").read_text()
    assert ".a-root" in styles
    for token in ["--ab-ink", "--ab-paper", "--ab-paper-2", "--ab-green", "--ab-accent", "--ab-rule"]:
        assert token in styles


def test_editorial_workspace_chrome_polish_css_present() -> None:
    styles = (FRONTEND_SRC / "styles.css").read_text()
    assert ".ws-rail-button:hover" in styles
    assert ".ws-account-signout:hover" in styles
