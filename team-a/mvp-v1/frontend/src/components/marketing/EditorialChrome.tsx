import type { ReactNode } from "react";

import type { Language, TFunction } from "../../i18n";
import { localizeRole } from "../../i18n";
import { ROLES } from "../../marketingData";

type LangProps = {
  language: Language;
  t: TFunction;
  onLanguageChange: (language: Language) => void;
};

type Active = "home" | "product" | "access" | "about";

export function ALogo() {
  return (
    <div className="a-nav-logo">
      <span className="mark" />
      <span>News Intelligence Studio</span>
    </div>
  );
}

function formatNavDate(language: Language) {
  return new Date().toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ALangToggle({
  language,
  onLanguageChange,
}: Pick<LangProps, "language" | "onLanguageChange">) {
  const options: Array<[Language, string]> = [
    ["en", "EN"],
    ["zh", "中文"],
  ];
  return (
    <div
      style={{
        display: "inline-flex",
        fontFamily: "var(--ab-font-mono)",
        fontSize: 11,
        letterSpacing: "0.12em",
        alignItems: "center",
      }}
    >
      {options.map(([value, label], i) => (
        <span key={value} style={{ display: "inline-flex", alignItems: "center" }}>
          {i > 0 && <span style={{ color: "var(--ab-ink-mute)", margin: "0 2px" }}>·</span>}
          <button
            type="button"
            onClick={() => onLanguageChange(value)}
            aria-pressed={language === value}
            style={{
              padding: "4px 8px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: language === value ? "var(--ab-ink)" : "var(--ab-ink-mute)",
              borderBottom:
                language === value
                  ? "1px solid var(--ab-ink)"
                  : "1px solid transparent",
              fontWeight: language === value ? 600 : 400,
              font: "inherit",
            }}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}

export function ANav({
  active,
  language,
  t,
  onLanguageChange,
}: LangProps & { active: Active }) {
  const items: Array<[Active, string, string]> = [
    ["home", t("nav.home"), "/"],
    ["product", t("nav.product"), "/product"],
    ["access", t("nav.access"), "/access"],
    ["about", t("nav.about"), "/about"],
  ];
  return (
    <div className="a-nav">
      <span className="a-nav-date">{formatNavDate(language)}</span>
      <nav className="a-nav-links">
        {items.map(([key, label, href]) => (
          <a
            key={key}
            href={href}
            style={{ color: key === active ? "var(--ab-ink)" : undefined }}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="a-nav-cta">
        <ALangToggle language={language} onLanguageChange={onLanguageChange} />
        <a href="/login" className="a-link" style={{ fontSize: 14 }}>
          {t("nav.signIn")}
        </a>
        <a href="/workspace" className="a-btn a-btn-primary">
          {t("nav.openWorkspace")} →
        </a>
      </div>
    </div>
  );
}

export function ASectionHead({
  eyebrow,
  title,
  italicTail,
  deck,
}: {
  eyebrow: string;
  title: ReactNode;
  italicTail?: ReactNode;
  deck?: string;
}) {
  return (
    <div className="a-sec-head">
      <div className="a-sec-head-text">
        <div className="a-smallcaps" style={{ marginBottom: 16 }}>
          {eyebrow}
        </div>
        <h2>
          {title}
          {italicTail && (
            <>
              <br />
              <em>{italicTail}</em>
            </>
          )}
        </h2>
        {deck && <p className="a-sec-head-deck">{deck}</p>}
      </div>
    </div>
  );
}

export function AFooter({ language, t }: Omit<LangProps, "onLanguageChange">) {
  return (
    <div className="a-foot">
      <div className="a-foot-cols">
        <div>
          <ALogo />
          <p
            style={{
              marginTop: 18,
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--ab-ink-soft)",
              maxWidth: 320,
              fontFamily: "var(--ab-font-display)",
            }}
          >
            {t("foot.tagline")}
          </p>
        </div>
        <div>
          <h4>{t("nav.product")}</h4>
          <ul>
            <li>
              <a href="/product#tour">{t("home.tour.eyebrow")}</a>
            </li>
            <li>
              <a href="/#personas">{t("home.personas.eyebrow")}</a>
            </li>
            <li>
              <a href="/product">{t("nav.product")}</a>
            </li>
            <li>
              <a href="/about">{t("nav.about")}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4>{t("nav.access")}</h4>
          <ul>
            <li>
              <a href="/access">{t("nav.access")}</a>
            </li>
            <li>
              <a href="/about">{t("nav.about")}</a>
            </li>
            <li>
              <a href="/login">{t("nav.signIn")}</a>
            </li>
            <li>
              <a href="/workspace">{t("common.example")}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4>{t("foot.roles")}</h4>
          <ul>
            {ROLES.map((r) => (
              <li key={r.value}>
                <a href="/access">{localizeRole(r.value, language, r.label)}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
