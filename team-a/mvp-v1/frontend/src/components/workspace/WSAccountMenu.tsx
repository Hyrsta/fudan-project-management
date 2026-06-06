import { useEffect, useState } from "react";
import type { TFunction } from "../../i18n";

type Props = {
  t: TFunction;
  accountName: string;
  roleLabel: string;
  hasKey: boolean;
  keyDraft: string;
  keySaved: boolean;
  rbacEnabled: boolean;
  onKeyDraftChange: (value: string) => void;
  onSaveKey: () => void;
  onRemoveKey: () => void;
  onSignOut: () => void;
};

export function WSAccountMenu(p: Props) {
  const {
    t, accountName, roleLabel, hasKey,
    keyDraft, keySaved, rbacEnabled,
    onKeyDraftChange, onSaveKey, onRemoveKey, onSignOut,
  } = p;
  const [open, setOpen] = useState(false);
  const initial = accountName.slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger pill — name + role + avatar */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "inline-flex", alignItems: "center", gap: 9,
          padding: "4px 7px 4px 13px", borderRadius: 999, cursor: "pointer",
          border: "1px solid",
          borderColor: open ? "var(--ab-ink)" : "var(--ab-rule)",
          background: open ? "var(--ab-paper)" : "transparent", fontSize: 12,
          transition: "border-color .15s ease",
        }}
      >
        <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.1, textAlign: "right" }}>
          <span style={{ fontWeight: 600 }}>{accountName}</span>
          <span className="a-mono" style={{ fontSize: 9, letterSpacing: "0.06em", color: "var(--ab-ink-mute)", textTransform: "uppercase" }}>
            {roleLabel}
          </span>
        </span>
        <span style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "var(--ab-ink)", color: "var(--ab-paper)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--ab-font-display)", fontSize: 12, fontWeight: 600,
        }}>
          {initial}
        </span>
      </button>

      {open && (
        <>
          {/* Click-outside scrim */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />

          {/* Popover */}
          <div style={{
            position: "absolute", top: "calc(100% + 12px)", right: 0, width: 332, zIndex: 21,
            background: "var(--ab-paper)", border: "1px solid var(--ab-ink)",
            boxShadow: "0 24px 60px -28px rgba(0,0,0,0.4)",
            borderRadius: 10, overflow: "hidden",
          }}>
            {/* Identity card */}
            <div style={{
              padding: "15px 16px", borderBottom: "1px solid var(--ab-rule)",
              background: "var(--ab-paper-2)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--ab-ink)", color: "var(--ab-paper)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--ab-font-display)", fontSize: 15, fontWeight: 600,
                flex: "0 0 auto",
              }}>{initial}</span>
              <div style={{ minWidth: 0 }}>
                <div className="a-serif" style={{ fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{accountName}</div>
                <div className="a-mono" style={{ fontSize: 9.5, letterSpacing: "0.08em", color: "var(--ab-ink-mute)", textTransform: "uppercase", marginTop: 2 }}>{roleLabel}</div>
              </div>
            </div>

            {/* Summariser model key */}
            <div style={{ padding: "14px 16px 16px" }}>
              <span className="a-smallcaps">{t("model.keyLabel")}</span>
              <p style={{ fontSize: 11.5, lineHeight: 1.5, color: "var(--ab-ink-soft)", margin: "7px 0 10px" }}>{t("model.copy")}</p>
              <input
                type="password"
                value={keyDraft}
                onChange={(e) => onKeyDraftChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSaveKey(); }}
                placeholder={hasKey ? "••••••••••••" : t("model.placeholder")}
                autoComplete="off"
                spellCheck={false}
                className="a-input a-mono"
                style={{
                  padding: "9px 11px", fontSize: 13, borderRadius: 7,
                  border: "1px solid color-mix(in oklab, var(--ab-ink) 28%, transparent)",
                  background: "var(--ab-paper-2)", width: "100%", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 11 }}>
                <button
                  type="button"
                  onClick={onSaveKey}
                  disabled={!keyDraft.trim()}
                  className="a-btn a-btn-primary"
                  style={{ padding: "7px 13px", fontSize: 12.5, opacity: keyDraft.trim() ? 1 : 0.5, cursor: keyDraft.trim() ? "pointer" : "not-allowed" }}
                >
                  {keySaved ? t("model.saved") : t("model.save")}
                </button>
                {hasKey && (
                  <button
                    type="button"
                    onClick={onRemoveKey}
                    className="a-mono"
                    style={{ padding: "7px 11px", fontSize: 10.5, letterSpacing: "0.04em", border: "1px solid var(--ab-rule)", background: "transparent", cursor: "pointer", color: "var(--ab-accent)", borderRadius: 7 }}
                  >
                    {t("model.remove")}
                  </button>
                )}
                <span style={{ flex: 1 }} />
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontFamily: "var(--ab-font-mono)", fontSize: 9.5, letterSpacing: "0.04em",
                  color: hasKey ? "var(--ab-green-deep)" : "var(--ab-ink-mute)",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: hasKey ? "var(--ab-green)" : "var(--ab-ink-mute)" }} />
                  {hasKey ? t("model.using") : t("model.usingLocal")}
                </span>
              </div>
            </div>

            {/* Sign out */}
            {rbacEnabled && (
              <button
                type="button"
                onClick={onSignOut}
                className="a-mono ws-account-signout"
                style={{
                  width: "100%", padding: "12px 16px", textAlign: "left",
                  fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "var(--ab-ink-soft)", background: "transparent",
                  border: 0, borderTop: "1px solid var(--ab-rule)", cursor: "pointer",
                }}
              >
                {t("ws.signOut")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
