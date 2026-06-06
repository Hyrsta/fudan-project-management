import type { Language, TFunction } from "../../i18n";
import { localizePersonaById } from "../../i18n";
import { DEMO_BRIEF, PERSONAS, PIPELINE } from "../../marketingData";
import type { PersonaLensId } from "../../types";
import { AFooter, ANav, ASectionHead } from "./EditorialChrome";
import { PersonaGlyph } from "./EditorialIcons";
import { EditorialAppMock, EditorialBriefMock } from "./EditorialMocks";

type PageProps = {
  language: Language;
  t: TFunction;
  onLanguageChange: (l: Language) => void;
};

export function MarketingHome({ language, t, onLanguageChange }: PageProps) {
  const b = DEMO_BRIEF;
  const stepDefs: Array<[string, "step.compose" | "step.collect" | "step.reason" | "step.export", string]> = [
    ["I", "step.compose", "step.composeCopy"],
    ["II", "step.collect", "step.collectCopy"],
    ["III", "step.reason", "step.reasonCopy"],
    ["IV", "step.export", "step.exportCopy"],
  ];

  const personaCopy = (id: PersonaLensId, fb: { label: string; short: string }) =>
    localizePersonaById(id, language, fb);

  const captionPersona = personaCopy(b.persona, {
    label: b.persona_label,
    short: "",
  }).label.toLowerCase();

  return (
    <div className="a-root">
      <ANav active="home" language={language} t={t} onLanguageChange={onLanguageChange} />

      <section className="a-hero">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div>
            <div className="a-smallcaps" style={{ marginBottom: 20 }}>
              {t("home.eyebrow")}
            </div>
            <h1 style={{ fontSize: 80 }}>
              {t("home.title.a")}
              <br />
              <em>{t("home.title.b")}</em>
            </h1>
            <p className="deck">{t("home.deck")}</p>
            <div className="ctas">
              <a href="/workspace" className="a-btn a-btn-primary">
                {t("home.cta.workspace")}
              </a>
              <a href="/workspace" className="a-btn a-btn-ghost">
                {t("home.cta.sample")}
              </a>
            </div>
            <div className="byline" style={{ marginTop: 28 }}>
              {t("home.byline")}
            </div>
          </div>
          <EditorialBriefMock language={language} t={t} />
        </div>
      </section>

      <section style={{ padding: "88px 56px 0" }} className="a-container">
        <ASectionHead
          eyebrow={t("home.pipeline.eyebrow")}
          title={t("home.pipeline.title.a")}
          italicTail={t("home.pipeline.title.b")}
        />
        <div className="a-feat-grid">
          {PIPELINE.map((f) => (
            <div key={f.n} className="a-feat">
              <div className="a-feat-num">AGENT · {f.n}</div>
              <h3>{f.name}</h3>
              <p>{f.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "96px 56px 0" }} className="a-container">
        <ASectionHead
          eyebrow={t("home.personas.eyebrow")}
          title={t("home.personas.title.a")}
          italicTail={t("home.personas.title.b")}
          deck={t("home.personas.aside")}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderTop: "1px solid var(--ab-ink)",
          }}
        >
          {PERSONAS.map((p, i) => {
            const featured = p.value === "research_analyst";
            const loc = personaCopy(p.value, { label: p.label, short: p.short });
            return (
              <div
                key={p.value}
                style={{
                  padding: "26px 22px 28px",
                  borderRight: (i + 1) % 3 !== 0 ? "1px solid var(--ab-rule)" : 0,
                  borderBottom: "1px solid var(--ab-rule)",
                  background: featured ? "var(--ab-paper-2)" : "transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      background: featured ? "var(--ab-accent)" : "var(--ab-ink)",
                      color: featured ? "#fff" : "var(--ab-paper)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PersonaGlyph value={p.value} />
                  </span>
                  <span
                    className="a-mono"
                    style={{
                      fontSize: 10,
                      color: featured ? "var(--ab-accent)" : "var(--ab-ink-mute)",
                      letterSpacing: "0.12em",
                    }}
                  >
                    LENS · {String(i + 1).padStart(2, "0")}
                    {featured && " · " + t("common.default").toUpperCase()}
                  </span>
                </div>
                <h3
                  className="a-serif"
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    margin: "0 0 6px",
                  }}
                >
                  {loc.label}
                </h3>
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    color: "var(--ab-ink-soft)",
                    margin: 0,
                  }}
                >
                  {loc.short}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ padding: "96px 56px 88px" }} className="a-container">
        <ASectionHead
          eyebrow={t("home.tour.eyebrow")}
          title={t("home.tour.title.a")}
          italicTail={t("home.tour.title.b")}
        />
        <EditorialAppMock language={language} t={t} />
        <p
          style={{
            textAlign: "center",
            marginTop: 18,
            fontSize: 13,
            fontFamily: "var(--ab-font-italic)",
            fontStyle: "italic",
            color: "var(--ab-ink-mute)",
          }}
        >
          {t("fig.caption", {
            topic: b.topic,
            persona: captionPersona,
            id: b.brief_id,
          })}
        </p>
      </section>

      <section style={{ padding: "0 56px 96px" }} className="a-container">
        <ASectionHead
          eyebrow={t("home.steps.eyebrow")}
          title={t("home.steps.title.a")}
          italicTail={t("home.steps.title.b")}
        />
        <div className="a-steps">
          {stepDefs.map(([n, hk, pk]) => (
            <div key={n} className="a-step">
              <div className="a-step-num">{n}</div>
              <h3>{t(hk)}</h3>
              <p>{t(pk as never)}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          padding: "88px 56px 112px",
          background: "var(--ab-paper-2)",
          borderTop: "1px solid var(--ab-rule)",
        }}
      >
        <div style={{ maxWidth: 880 }}>
          <div className="a-smallcaps" style={{ marginBottom: 18 }}>
            {t("home.steps.eyebrow")}
          </div>
          <h2
            className="a-serif"
            style={{
              fontSize: 56,
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
              fontWeight: 500,
              margin: 0,
            }}
          >
            {t("home.title.a")}{" "}
            <em
              className="a-italic"
              style={{ fontStyle: "italic", color: "var(--ab-accent)" }}
            >
              {t("home.title.b")}
            </em>
          </h2>
          <div style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
            <a href="/workspace" className="a-btn a-btn-primary">
              {t("home.cta.workspace")} →
            </a>
            <a href="/access" className="a-btn a-btn-ghost">
              {t("nav.access")}
            </a>
          </div>
        </div>
      </section>

      <AFooter language={language} t={t} />
    </div>
  );
}
