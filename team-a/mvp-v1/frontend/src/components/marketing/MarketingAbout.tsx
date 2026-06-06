import type { Language, TFunction, TranslationKey } from "../../i18n";
import { AFooter, ANav, ASectionHead } from "./EditorialChrome";

type PageProps = {
  language: Language;
  t: TFunction;
  onLanguageChange: (l: Language) => void;
};

export function MarketingAbout({ language, t, onLanguageChange }: PageProps) {
  const principles: Array<[TranslationKey, TranslationKey]> = [
    ["about.p1", "about.p1c"],
    ["about.p2", "about.p2c"],
    ["about.p3", "about.p3c"],
  ];

  return (
    <div className="a-root">
      <ANav active="about" language={language} t={t} onLanguageChange={onLanguageChange} />

      <section className="a-hero" style={{ paddingBottom: 48 }}>
        <div className="a-smallcaps" style={{ marginBottom: 22 }}>
          {t("about.eyebrow")}
        </div>
        <h1 style={{ fontSize: 80 }}>
          {t("about.title.a")}
          <br />
          <em>{t("about.title.b")}</em>
        </h1>
        <p className="deck" style={{ maxWidth: 760 }}>
          {t("about.deck")}
        </p>
      </section>

      <section style={{ padding: "80px 56px 0" }} className="a-container">
        <ASectionHead eyebrow={t("about.principles")} title={t("about.principles")} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderTop: "1px solid var(--ab-ink)",
          }}
        >
          {principles.map(([hk, ck], i) => (
            <div
              key={i}
              style={{
                padding: "34px 28px 38px",
                borderRight: i < 2 ? "1px solid var(--ab-rule)" : 0,
                borderBottom: "1px solid var(--ab-rule)",
              }}
            >
              <div
                className="a-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ab-accent)",
                  letterSpacing: "0.16em",
                  marginBottom: 22,
                }}
              >
                PRINCIPLE 0{i + 1}
              </div>
              <h3
                className="a-serif"
                style={{
                  fontSize: 25,
                  lineHeight: 1.15,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  margin: "0 0 14px",
                }}
              >
                {t(hk)}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "var(--ab-ink-soft)",
                  margin: 0,
                }}
              >
                {t(ck)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "72px 56px 96px" }} className="a-container">
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <a href="/workspace" className="a-btn a-btn-primary">
            {t("nav.openWorkspace")} →
          </a>
          <a href="/product" className="a-btn a-btn-ghost">
            {t("nav.product")}
          </a>
        </div>
      </section>
      <AFooter language={language} t={t} />
    </div>
  );
}
