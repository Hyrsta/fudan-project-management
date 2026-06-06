import { ReactNode } from "react";
import type { Language, TFunction } from "../../i18n";
import { LanguageToggle } from "../LanguageToggle";
import { RailIcon, type RailIconKind } from "../marketing/EditorialIcons";
import { WSAccountMenu } from "./WSAccountMenu";

export type WorkspaceView = "briefing" | "history" | "sources";

type Props = {
  activeView: WorkspaceView;
  language: Language;
  t: TFunction;
  roleLabel: string;
  accountName: string;
  productName: string;
  hasKey: boolean;
  keyDraft: string;
  keySaved: boolean;
  rbacEnabled: boolean;
  onViewChange: (v: WorkspaceView) => void;
  onLanguageChange: (l: Language) => void;
  onKeyDraftChange: (v: string) => void;
  onSaveKey: () => void;
  onRemoveKey: () => void;
  onSignOut: () => void;
  children: ReactNode;
};

export function WorkspaceShell(p: Props) {
  const today = new Date().toLocaleDateString(
    p.language === "zh" ? "zh-CN" : "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" },
  );

  const navItems: Array<[WorkspaceView, RailIconKind, string]> = [
    ["briefing", "search", p.t("ws.sectionBriefing")],
    ["history", "bookmark", p.t("ws.sectionHistory")],
    ["sources", "radio", p.t("ws.sectionSources")],
  ];
  const sectionLabel = (navItems.find((n) => n[0] === p.activeView) || navItems[0])[2];

  return (
    <div className="a-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Thin top masthead band */}
      <div className="ws-mast" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 24px", borderBottom: "1px solid var(--ab-rule)",
        background: "var(--ab-paper)",
        fontFamily: "var(--ab-font-mono)", fontSize: 10.5, letterSpacing: "0.04em",
        color: "var(--ab-ink-mute)",
      }}>
        <span>{today}</span>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span>{sectionLabel}</span>
          <span>·</span>
          <span>{p.t("ws.localFirst")}</span>
        </div>
        <span>{p.t("ws.edition")}</span>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Dark left rail */}
        <aside aria-label={p.t("nav.workspace")} className="ws-rail" style={{
          width: 84, flex: "0 0 84px",
          background: "var(--ab-ink)",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "18px 0", gap: 4,
        }}>
          <span style={{
            width: 38, height: 38, borderRadius: 10,
            background: "var(--ab-accent)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
            boxShadow: "0 8px 18px -6px color-mix(in oklab, var(--ab-accent) 70%, transparent)",
          }}>
            <svg width="17" height="17" viewBox="0 0 14 14" fill="none">
              <path d="M3 1.5h5l3 3v8H3v-11z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M8 1.5v3h3M5 7.5h4M5 9.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </span>
          {navItems.map(([v, icon, label]) => {
            const on = p.activeView === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => p.onViewChange(v)}
                title={label}
                className="ws-rail-button"
                aria-current={on ? "page" : undefined}
                aria-label={label}
                style={{
                  width: 66, padding: "10px 4px 9px", borderRadius: 9, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  color: on ? "#fff" : "color-mix(in oklab, var(--ab-paper) 50%, transparent)",
                  background: on ? "color-mix(in oklab, var(--ab-green) 55%, transparent)" : "transparent",
                  border: on
                    ? "1px solid color-mix(in oklab, var(--ab-green) 78%, transparent)"
                    : "1px solid transparent",
                  transition: "background .15s ease, color .15s ease",
                }}
              >
                <RailIcon kind={icon} />
                <span style={{
                  fontFamily: "var(--ab-font-mono)", fontSize: 8.5, letterSpacing: "0.05em",
                  textTransform: "uppercase", lineHeight: 1.2, textAlign: "center",
                }}>{label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main column */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Topbar */}
          <header className="ws-topbar" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 40px", borderBottom: "1px solid var(--ab-rule)",
            background: "color-mix(in oklab, var(--ab-paper) 70%, var(--ab-paper-2))",
            position: "sticky", top: 0, zIndex: 10,
          }}>
            <div>
              <div className="a-mono" style={{
                fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
                color: "var(--ab-accent)", fontWeight: 600, marginBottom: 3,
              }}>{sectionLabel}</div>
              <div className="a-serif" style={{
                fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", whiteSpace: "nowrap",
              }}>{p.productName}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 11px", borderRadius: 999,
                background: "var(--ab-green-soft)",
                border: "1px solid color-mix(in oklab, var(--ab-green) 30%, transparent)",
                fontFamily: "var(--ab-font-mono)", fontSize: 10.5, letterSpacing: "0.04em",
                color: "var(--ab-green-deep)", fontWeight: 600,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ab-green)" }} />
                {p.t("ws.localDataSynced")}
              </span>
              <LanguageToggle language={p.language} t={p.t} onLanguageChange={p.onLanguageChange} />
              <WSAccountMenu
                t={p.t}
                accountName={p.accountName}
                roleLabel={p.roleLabel}
                hasKey={p.hasKey}
                keyDraft={p.keyDraft}
                keySaved={p.keySaved}
                rbacEnabled={p.rbacEnabled}
                onKeyDraftChange={p.onKeyDraftChange}
                onSaveKey={p.onSaveKey}
                onRemoveKey={p.onRemoveKey}
                onSignOut={p.onSignOut}
              />
            </div>
          </header>

          {/* Content */}
          <div style={{ flex: 1, overflow: "auto", background: "var(--ab-paper)" }}>
            {p.children}
          </div>
        </main>
      </div>
    </div>
  );
}
