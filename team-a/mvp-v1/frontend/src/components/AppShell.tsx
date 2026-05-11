import {
  Bookmark,
  Database,
  FileText,
  LogOut,
  Radar,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

type AppShellProps = {
  children: ReactNode;
  roleLabel: string;
  rbacEnabled: boolean;
  onHint: (message: string) => void;
  onLogout: () => void;
};

export function AppShell({ children, roleLabel, rbacEnabled, onHint, onLogout }: AppShellProps) {
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
      <aside className="side-rail" aria-label="Primary navigation">
        <a className="rail-logo" href="/" aria-label="News Intelligence Studio">
          <FileText size={18} />
        </a>
        <nav className="rail-nav" aria-label="Workspace">
          <button className="rail-button is-active" type="button" aria-label="Research">
            <Search size={18} />
          </button>
          <button
            className="rail-button"
            type="button"
            aria-label="Saved reports"
            onClick={() => onHint("Recent reports are beside the command bar")}
          >
            <Bookmark size={18} />
          </button>
          <button
            className="rail-button"
            type="button"
            aria-label="Source evidence"
            onClick={() => onHint("Open a report to inspect ranked source evidence")}
          >
            <Database size={18} />
          </button>
          <button
            className="rail-button"
            type="button"
            aria-label="Signal watch"
            onClick={() => onHint("Watch items appear inside generated reports")}
          >
            <Radar size={18} />
          </button>
        </nav>
      </aside>

      <main className="app-content">
        <div className="app-shell">
          <header className="topbar">
            <div className="brand-block">
              <span className="eyebrow">
                <SlidersHorizontal size={14} />
                Analyst command center
              </span>
              <h1>News Intelligence Studio</h1>
            </div>
            <div className="top-actions">
              <span className="status-chip sync">Local data synced</span>
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
                  {roleLabel}
                </button>
                {isProfileOpen && (
                  <div className="profile-dropdown" id="profile-menu" role="menu">
                    <div className="profile-summary">
                      <span className="avatar-chip">{roleInitials}</span>
                      <span>
                        <strong>{roleLabel}</strong>
                        <small>Local workspace session</small>
                      </span>
                    </div>
                    <button className="profile-menu-item" type="button" role="menuitem" onClick={() => onHint("Current role controls route access")}>
                      <UserRound size={16} />
                      Role details
                    </button>
                    {rbacEnabled && (
                      <button className="profile-menu-item is-danger" type="button" role="menuitem" onClick={handleLogout}>
                        <LogOut size={16} />
                        Sign out
                      </button>
                    )}
                  </div>
                )}
              </div>
              <span className="avatar-chip">{roleInitials}</span>
            </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
