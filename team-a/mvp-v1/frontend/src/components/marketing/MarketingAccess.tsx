import type { Language, TFunction } from "../../i18n";
import { localizeRole } from "../../i18n";
import { ROLES } from "../../marketingData";
import { AFooter, AMasthead, ANav } from "./EditorialChrome";

type PageProps = {
  language: Language;
  t: TFunction;
  onLanguageChange: (l: Language) => void;
};

export function MarketingAccess({ language, t, onLanguageChange }: PageProps) {
  const planFeatures = [
    t("access.feature.reports"),
    t("access.feature.sources"),
    t("access.feature.exports"),
    t("access.feature.roles"),
  ];

  return (
    <div className="a-root">
      <AMasthead section={t("nav.access")} language={language} t={t} />
      <ANav active="access" language={language} t={t} onLanguageChange={onLanguageChange} />

      <section className="a-hero" style={{ paddingBottom: 40 }}>
        <div className="a-smallcaps" style={{ marginBottom: 22 }}>
          {t("access.eyebrow")}
        </div>
        <h1 style={{ fontSize: 80 }}>
          {t("access.title.a")}
          <br />
          <em>{t("access.title.b")}</em>
        </h1>
        <p className="deck" style={{ maxWidth: 700 }}>
          {t("access.deck")}
        </p>
      </section>

      <section style={{ padding: "40px 56px 24px" }} className="a-container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr",
            gap: 0,
            borderTop: "2px solid var(--ab-ink)",
          }}
        >
          <div
            style={{
              padding: "32px 28px",
              borderRight: "1px solid var(--ab-rule)",
              background: "var(--ab-paper-2)",
            }}
          >
            <div
              className="a-mono"
              style={{
                fontSize: 11,
                color: "var(--ab-ink-mute)",
                letterSpacing: "0.14em",
                marginBottom: 14,
              }}
            >
              {t("access.eyebrow").toUpperCase()}
            </div>
            <div
              className="a-serif"
              style={{
                fontSize: 30,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                marginBottom: 8,
              }}
            >
              {t("access.plan")}
            </div>
            <p
              style={{
                fontSize: 14,
                color: "var(--ab-ink-soft)",
                lineHeight: 1.55,
                marginBottom: 24,
                fontFamily: "var(--ab-font-display)",
              }}
            >
              {t("access.planCopy")}
            </p>
            <div
              className="a-serif"
              style={{
                fontSize: 48,
                fontWeight: 500,
                letterSpacing: "-0.025em",
                marginBottom: 24,
              }}
            >
              {t("access.price")}
            </div>
            <a
              href="/login"
              className="a-btn a-btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {t("auth.secureLocalAccess")} →
            </a>
            <hr className="a-rule" style={{ margin: "24px 0 18px" }} />
            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
            >
              {planFeatures.map((bullet, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    className="a-mono"
                    style={{
                      color: "var(--ab-accent)",
                      fontWeight: 600,
                      flex: "0 0 auto",
                    }}
                  >
                    ·
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ padding: "32px 28px" }}>
            <div
              className="a-mono"
              style={{
                fontSize: 11,
                color: "var(--ab-ink-mute)",
                letterSpacing: "0.14em",
                marginBottom: 18,
              }}
            >
              {t("access.rolesTitle").toUpperCase()}
            </div>
            <div style={{ borderTop: "1px solid var(--ab-rule)" }}>
              {ROLES.map((r) => (
                <div
                  key={r.value}
                  style={{
                    padding: "20px 0",
                    borderBottom: "1px solid var(--ab-rule-soft)",
                    display: "grid",
                    gridTemplateColumns: "150px 1fr",
                    gap: 24,
                    alignItems: "baseline",
                  }}
                >
                  <div
                    className="a-serif"
                    style={{ fontSize: 22, fontWeight: 600 }}
                  >
                    {localizeRole(r.value, language, r.label)}
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      color: "var(--ab-ink-soft)",
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {r.blurb}
                  </p>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 18,
                padding: "14px 16px",
                background: "var(--ab-paper-2)",
                border: "1px solid var(--ab-rule)",
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 12,
                alignItems: "start",
              }}
            >
              <span
                className="a-mono"
                style={{
                  fontSize: 10,
                  color: "var(--ab-accent)",
                  letterSpacing: "0.12em",
                  marginTop: 2,
                }}
              >
                NOTE
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--ab-ink-soft)",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {t("access.note")}
              </p>
            </div>
          </div>
        </div>
      </section>
      <div style={{ height: 64 }} />
      <AFooter language={language} t={t} />
    </div>
  );
}
