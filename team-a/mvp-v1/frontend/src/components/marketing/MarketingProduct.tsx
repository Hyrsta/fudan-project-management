import type { Language, TFunction, TranslationKey } from "../../i18n";
import { COVERAGE_MODES, DEMO_BRIEF, SIGNALS } from "../../marketingData";
import {
  AFooter,
  AMasthead,
  ANav,
  ASectionHead,
} from "./EditorialChrome";
import { EditorialAppMock } from "./EditorialMocks";

type PageProps = {
  language: Language;
  t: TFunction;
  onLanguageChange: (l: Language) => void;
};

type Feature = {
  n: string;
  tag: string;
  h: string;
  lede: string;
  bullets: Array<[string, string]>;
};

export function MarketingProduct({ language, t, onLanguageChange }: PageProps) {
  const b = DEMO_BRIEF;
  const zh = language === "zh";

  const features: Feature[] = (["1", "2", "3", "4", "5"] as const).map((n, idx) => {
    const roman = ["I", "II", "III", "IV", "V"][idx];
    const base = `product.f${n}` as const;
    const bulletCount = n === "1" || n === "2" ? 4 : 3;
    const bullets: Array<[string, string]> = [];
    for (let i = 1; i <= bulletCount; i++) {
      const hKey = `${base}.b${i}.h` as TranslationKey;
      const pKey = `${base}.b${i}.p` as TranslationKey;
      bullets.push([t(hKey), t(pKey)]);
    }
    return {
      n: roman,
      tag: t(`${base}.tag` as TranslationKey),
      h: t(`${base}.h` as TranslationKey),
      lede: t(`${base}.lede` as TranslationKey),
      bullets,
    };
  });

  const signalKey = (k: "c" | "f" | "t") =>
    k === "c" ? "cred" : k === "f" ? "fresh" : "fit";

  const signals = SIGNALS.map((sg) => ({
    ...sg,
    label: t(`ranking.${signalKey(sg.key)}.label` as TranslationKey),
    blurb: t(`ranking.${signalKey(sg.key)}.blurb` as TranslationKey),
  }));

  const coverageModes = COVERAGE_MODES.map((m) => ({
    ...m,
    label: t(`coverage.${m.value}.label` as TranslationKey),
    flow: t(`coverage.${m.value}.flow` as TranslationKey),
    blurb: t(`coverage.${m.value}.blurb` as TranslationKey),
  }));

  const archRows: Array<[string, string]> = [
    [t("product.arch.row1.h"), t("product.arch.row1.p")],
    [t("product.arch.row2.h"), t("product.arch.row2.p")],
    [t("product.arch.row3.h"), t("product.arch.row3.p")],
    [t("product.arch.row4.h"), t("product.arch.row4.p")],
  ];

  return (
    <div className="a-root">
      <AMasthead section={t("product.section")} language={language} t={t} />
      <ANav active="product" language={language} t={t} onLanguageChange={onLanguageChange} />

      <section className="a-hero" style={{ paddingBottom: 48 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 56,
            alignItems: "end",
          }}
        >
          <div>
            <div className="a-smallcaps" style={{ marginBottom: 20 }}>
              {t("product.eyebrow")}
            </div>
            <h1 style={{ fontSize: 80 }}>
              {t("product.title.a")}
              <br />
              <em>{t("product.title.b")}</em>
            </h1>
            <p className="deck" style={{ maxWidth: 560 }}>
              {t("product.deck")}
            </p>
            <div className="ctas">
              <a href="/workspace" className="a-btn a-btn-primary">
                {t("nav.openWorkspace")}
              </a>
              <a href="/about" className="a-btn a-btn-ghost">
                {t("nav.about")} →
              </a>
            </div>
          </div>
          <div
            style={{
              border: "1px solid var(--ab-rule)",
              padding: "22px 24px",
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
              {t("product.contents").toUpperCase()}
            </div>
            <ol
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
            >
              {features.map((f, i) => (
                <li
                  key={f.n}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr auto",
                    gap: 12,
                    alignItems: "baseline",
                    paddingBottom: 10,
                    borderBottom:
                      i < features.length - 1 ? "1px solid var(--ab-rule-soft)" : 0,
                  }}
                >
                  <span
                    className="a-mono"
                    style={{
                      fontSize: 11,
                      color: "var(--ab-accent)",
                      letterSpacing: "0.12em",
                    }}
                  >
                    {f.n}
                  </span>
                  <span className="a-serif" style={{ fontSize: 15, fontWeight: 600 }}>
                    {f.h}
                  </span>
                  <span
                    className="a-mono"
                    style={{ fontSize: 10, color: "var(--ab-ink-mute)" }}
                  >
                    {zh ? "第" + (i + 1) + "节" : "p." + (i + 1)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section style={{ padding: "64px 56px 16px" }} className="a-container">
        <div className="a-sec-head">
          <div>
            <div className="a-smallcaps" style={{ marginBottom: 16 }}>
              {t("product.fig1.eyebrow")}
            </div>
            <h2>
              {t("product.fig1.title.a")}
              <br />
              <em>{t("product.fig1.title.b")}</em>
            </h2>
          </div>
        </div>
        <EditorialAppMock language={language} t={t} />
      </section>

      {features.map((f, idx) => (
        <section
          key={f.n}
          style={{
            padding: "80px 56px 0",
            borderTop:
              idx === 0 ? "2px solid var(--ab-ink)" : "1px solid var(--ab-rule)",
          }}
          className="a-container"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 1.2fr",
              gap: 48,
              alignItems: "start",
            }}
          >
            <div>
              <div className="a-step-num" style={{ fontSize: 56, marginBottom: 8 }}>
                {f.n}
              </div>
              <div
                className="a-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ab-ink-mute)",
                  letterSpacing: "0.14em",
                }}
              >
                {f.tag}
              </div>
            </div>
            <div>
              <h3
                className="a-serif"
                style={{
                  fontSize: 40,
                  lineHeight: 1.04,
                  letterSpacing: "-0.02em",
                  fontWeight: 500,
                  margin: "0 0 20px",
                }}
              >
                {f.h}
              </h3>
              <p
                className="a-serif"
                style={{
                  fontSize: 18,
                  lineHeight: 1.55,
                  color: "var(--ab-ink-soft)",
                  maxWidth: 460,
                  margin: 0,
                }}
              >
                {f.lede}
              </p>
            </div>
            <div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {f.bullets.map(([h, p], i) => (
                  <li
                    key={i}
                    style={{
                      padding: "16px 0",
                      borderTop:
                        i === 0
                          ? "1px solid var(--ab-ink)"
                          : "1px solid var(--ab-rule-soft)",
                      display: "grid",
                      gridTemplateColumns: "190px 1fr",
                      gap: 20,
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      className="a-mono"
                      style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.02em" }}
                    >
                      {h}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: "var(--ab-ink-soft)",
                        lineHeight: 1.55,
                      }}
                    >
                      {p}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}

      <section style={{ padding: "88px 56px 0" }} className="a-container">
        <ASectionHead
          eyebrow={t("product.worked.eyebrow")}
          title={t("product.worked.title.a")}
          italicTail={t("product.worked.title.b")}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              border: "1px solid var(--ab-ink)",
              padding: "28px",
              background: "var(--ab-paper-2)",
            }}
          >
            <div className="a-smallcaps" style={{ marginBottom: 18 }}>
              {t("product.worked.formula")}
            </div>
            <p
              className="a-serif"
              style={{
                fontSize: 26,
                lineHeight: 1.2,
                fontWeight: 500,
                letterSpacing: "-0.015em",
                margin: 0,
              }}
            >
              <span style={{ color: "var(--ab-accent)" }}>{t("product.worked.score")}</span>{" "}
              = 0.45·{t("product.worked.cred")} + 0.35·{t("product.worked.fresh")} + 0.20·
              {t("product.worked.fit")}
            </p>
            <hr className="a-rule" style={{ margin: "22px 0 16px" }} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "10px 18px",
                fontSize: 13,
              }}
            >
              {signals.map((sg) => (
                <span key={sg.key} style={{ display: "contents" }}>
                  <span className="a-mono" style={{ color: "var(--ab-accent)" }}>
                    {sg.w.toFixed(2)}
                  </span>
                  <span>
                    <span className="a-serif" style={{ fontWeight: 600 }}>
                      {sg.label}.
                    </span>{" "}
                    <span style={{ color: "var(--ab-ink-soft)" }}>{sg.blurb}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "2px solid var(--ab-ink)" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1.4fr 70px 70px 60px 64px",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid var(--ab-rule)",
                fontFamily: "var(--ab-font-mono)",
                fontSize: 10,
                color: "var(--ab-ink-mute)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              <span>#</span>
              <span>{t("product.worked.col.outlet")}</span>
              <span style={{ textAlign: "right" }}>{t("product.worked.col.cred")}</span>
              <span style={{ textAlign: "right" }}>{t("product.worked.col.fresh")}</span>
              <span style={{ textAlign: "right" }}>{t("product.worked.col.fit")}</span>
              <span style={{ textAlign: "right", color: "var(--ab-accent)" }}>
                {t("product.worked.col.total")}
              </span>
            </div>
            {b.source_evidence.map((sv) => (
              <div
                key={sv.n}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1.4fr 70px 70px 60px 64px",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom: "1px solid var(--ab-rule-soft)",
                  alignItems: "center",
                  fontSize: 13,
                }}
              >
                <span className="a-mono" style={{ color: "var(--ab-ink-mute)" }}>
                  {sv.n}
                </span>
                <span className="a-serif" style={{ fontWeight: 600 }}>
                  {sv.src}
                </span>
                <span className="a-mono a-tabnum" style={{ textAlign: "right" }}>
                  {sv.cred.toFixed(2)}
                </span>
                <span className="a-mono a-tabnum" style={{ textAlign: "right" }}>
                  {sv.fresh.toFixed(2)}
                </span>
                <span className="a-mono a-tabnum" style={{ textAlign: "right" }}>
                  {sv.fit.toFixed(2)}
                </span>
                <span
                  className="a-mono a-tabnum"
                  style={{ textAlign: "right", color: "var(--ab-accent)", fontWeight: 600 }}
                >
                  {sv.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "64px 56px 0" }} className="a-container">
        <ASectionHead
          eyebrow={t("product.coverage.eyebrow")}
          title={t("product.coverage.title.a")}
          italicTail={t("product.coverage.title.b")}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderTop: "1px solid var(--ab-ink)",
          }}
        >
          {coverageModes.map((m, i) => (
            <div
              key={m.value}
              style={{
                padding: "30px 26px 34px",
                borderRight: i < 2 ? "1px solid var(--ab-rule)" : 0,
                borderBottom: "1px solid var(--ab-rule)",
                background: i === 0 ? "var(--ab-paper-2)" : "transparent",
              }}
            >
              <div
                className="a-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ab-accent)",
                  letterSpacing: "0.14em",
                  marginBottom: 16,
                }}
              >
                {t("product.coverage.mode")} · {String(i + 1).padStart(2, "0")}
                {i === 0 && " · " + t("common.default").toUpperCase()}
              </div>
              <h3
                className="a-serif"
                style={{
                  fontSize: 30,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  margin: "0 0 12px",
                }}
              >
                {m.label}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "var(--ab-ink-soft)",
                  marginBottom: 16,
                }}
              >
                {m.blurb}
              </p>
              <div
                className="a-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ab-ink-mute)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {m.flow}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "64px 56px 96px" }} className="a-container">
        <ASectionHead
          eyebrow={t("product.arch.eyebrow")}
          title={t("product.arch.title.a")}
          italicTail={t("product.arch.title.b")}
        />
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {archRows.map(([h, p], i) => (
            <li
              key={i}
              style={{
                padding: "20px 0",
                borderTop: "1px solid var(--ab-rule)",
                borderBottom: i === 3 ? "1px solid var(--ab-rule)" : 0,
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                gap: 28,
              }}
            >
              <span className="a-serif" style={{ fontSize: 19, fontWeight: 600 }}>
                {h}
              </span>
              <span
                style={{
                  fontSize: 15,
                  color: "var(--ab-ink-soft)",
                  lineHeight: 1.55,
                }}
              >
                {p}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <AFooter language={language} t={t} />
    </div>
  );
}
