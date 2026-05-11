import {
  Bookmark,
  FileText,
  LogOut,
  RadioTower,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import type { Language, TFunction } from "../i18n";
import { LanguageToggle } from "./LanguageToggle";

type AppShellProps = {
  children: ReactNode;
  activeView: "briefing" | "history" | "sources";
  roleLabel: string;
  rbacEnabled: boolean;
  language: Language;
  t: TFunction;
  onHint: (message: string) => void;
  onViewChange: (view: "briefing" | "history" | "sources") => void;
  onLanguageChange: (language: Language) => void;
  onLogout: () => void;
};

export function AppShell({
  children,
  activeView,
  roleLabel,
  rbacEnabled,
  language,
  t,
  onHint,
  onViewChange,
  onLanguageChange,
  onLogout,
}: AppShellProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const roleInitials = roleLabel.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!isProfileOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isProfileOpen]);

  function handleLogout() {
    setIsProfileOpen(false);
    onLogout();
  }

  return (
    <div className="app-frame command-center">
      <aside className="side-rail" aria-label={t("nav.workspace")}>
        <div className="rail-brand" title={t("product.name")} aria-hidden="true">
          <span className="rail-logo-mark">
            <FileText size={18} />
          </span>
        </div>
        <nav className="rail-nav" aria-label={t("nav.primary")}>
          <button
            className="rail-button"
            type="button"
            aria-label={t("nav.newBrief")}
            title={t("nav.newBrief")}
            aria-current={activeView === "briefing" ? "page" : undefined}
            onClick={() => onViewChange("briefing")}
          >
            <Search size={18} />
          </button>
          <button
            className="rail-button"
            type="button"
            aria-label={t("nav.recentBriefs")}
            title={t("nav.recentBriefs")}
            aria-current={activeView === "history" ? "page" : undefined}
            onClick={() => onViewChange("history")}
          >
            <Bookmark size={18} />
          </button>
          <button
            className="rail-button"
            type="button"
            aria-label={t("nav.trustedSources")}
            title={t("nav.trustedSources")}
            aria-current={activeView === "sources" ? "page" : undefined}
            onClick={() => onViewChange("sources")}
          >
            <RadioTower size={18} />
          </button>
        </nav>
      </aside>

      <main className="app-content">
        <div className="app-shell">
          <header className="topbar">
            <div className="brand-block">
              <span className="eyebrow">
                <SlidersHorizontal size={14} />
                {t("app.commandCenter")}
              </span>
              <h1>{t("product.name")}</h1>
            </div>
            <div className="top-actions">
              <span className="status-chip sync">{t("app.localDataSynced")}</span>
              <div className="top-language-switch">
                <LanguageToggle language={language} t={t} onLanguageChange={onLanguageChange} />
              </div>
              <div className="profile-menu" ref={profileMenuRef}>
                <button
                  className="status-chip profile-trigger"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                  aria-controls="profile-menu"
                  onClick={() => setIsProfileOpen((current) => !current)}
                >
                  <ShieldCheck size={16} />
                  <span className="profile-trigger-label">{roleLabel}</span>
                  <span className="profile-trigger-avatar">{roleInitials}</span>
                </button>
                {isProfileOpen && (
                  <div className="profile-dropdown" id="profile-menu" role="menu">
                    <div className="profile-summary">
                      <span className="avatar-chip">{roleInitials}</span>
                      <span>
                        <strong>{roleLabel}</strong>
                        <small>{t("profile.session")}</small>
                      </span>
                    </div>
                    <button className="profile-menu-item" type="button" role="menuitem" onClick={() => onHint(t("profile.roleHint"))}>
                      <UserRound size={16} />
                      {t("profile.roleDetails")}
                    </button>
                    {rbacEnabled && (
                      <button className="profile-menu-item is-danger" type="button" role="menuitem" onClick={handleLogout}>
                        <LogOut size={16} />
                        {t("profile.signOut")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
