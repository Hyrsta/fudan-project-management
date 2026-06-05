import type { ReactNode } from "react";

import type { Language, TFunction } from "../../i18n";
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

export function AMasthead({
  section,
  language,
  t,
}: {
  section?: string;
  language: Language;
  t: TFunction;
}) {
  const today = new Date().toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="a-mast">
      <span>{today}</span>
      <div className="a-mast-mid">
        {section && (
          <>
            <span>{section}</span>
            <span>·</span>
          </>
        )}
        <span>{t("mast.localFirst")}</span>
      </div>
      <span>{t("mast.edition")}</span>
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
      <a href="/" style={{ display: "flex" }}>
        <ALogo />
      </a>
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
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  italicTail?: ReactNode;
  aside?: string;
}) {
  return (
    <div className="a-sec-head">
      <div>
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
      </div>
      {aside && (
        <p style={{ fontSize: 14, color: "var(--ab-ink-soft)", maxWidth: 280, margin: 0 }}>
          {aside}
        </p>
      )}
    </div>
  );
}

export function AFooter({ language, t }: Omit<LangProps, "onLanguageChange">) {
  void language;
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
          <p
            className="a-mono"
            style={{
              marginTop: 22,
              fontSize: 11,
              color: "var(--ab-ink-mute)",
              letterSpacing: "0.06em",
            }}
          >
            {t("foot.builtAs")}
          </p>
        </div>
        <div>
          <h4>{t("nav.product")}</h4>
          <ul>
            <li>
              <a href="/product">{t("home.tour.eyebrow")}</a>
            </li>
            <li>
              <a href="/product">{t("home.pipeline.eyebrow")}</a>
            </li>
            <li>
              <a href="/product">{t("home.personas.eyebrow")}</a>
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
          <h4>RBAC</h4>
          <ul>
            {ROLES.map((r) => (
              <li key={r.value}>
                <a href="/access">{r.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
