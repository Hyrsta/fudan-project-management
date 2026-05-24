import { ArrowRight, CheckCircle2, FileText, LockKeyhole, Newspaper, ShieldCheck, Workflow } from "lucide-react";
import type { Language, TFunction } from "../i18n";
import { LanguageToggle } from "./LanguageToggle";

type MarketingPageProps = {
  language: Language;
  t: TFunction;
  onLanguageChange: (language: Language) => void;
};

type MarketingNavProps = MarketingPageProps & {
  active: "home" | "pricing";
};

const proofPoints = [
  "marketing.proof.sources",
  "marketing.proof.exports",
  "marketing.proof.rbac",
] as const;

const workflowSteps = [
  { icon: Newspaper, title: "marketing.workflow.collect", copy: "marketing.workflow.collectCopy" },
  { icon: Workflow, title: "marketing.workflow.analyze", copy: "marketing.workflow.analyzeCopy" },
  { icon: ShieldCheck, title: "marketing.workflow.handoff", copy: "marketing.workflow.handoffCopy" },
] as const;

const planFeatures = [
  "marketing.pricing.feature.reports",
  "marketing.pricing.feature.sources",
  "marketing.pricing.feature.exports",
  "marketing.pricing.feature.roles",
] as const;

export function MarketingHomePage({ language, t, onLanguageChange }: MarketingPageProps) {
  return (
    <main className="marketing-page">
      <MarketingNav active="home" language={language} t={t} onLanguageChange={onLanguageChange} />

      <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <span className="eyebrow">
            <ShieldCheck size={14} />
            {t("marketing.eyebrow")}
          </span>
          <h1>{t("marketing.home.title")}</h1>
          <p>{t("marketing.home.copy")}</p>
          <div className="marketing-actions">
            <a className="primary-button" href="/login">
              {t("marketing.cta.workspace")}
              <ArrowRight size={18} />
            </a>
            <a className="secondary-button" href="/pricing">
              {t("marketing.cta.pricing")}
            </a>
          </div>
        </div>

        <div className="marketing-brief-preview" aria-label={t("marketing.preview.label")}>
          <div className="marketing-preview-head">
            <span>
              <FileText size={16} />
              {t("marketing.preview.title")}
            </span>
            <strong>{t("marketing.preview.status")}</strong>
          </div>
          <div className="marketing-preview-topic">{t("marketing.preview.topic")}</div>
          <div className="marketing-preview-grid">
            {proofPoints.map((key) => (
              <span key={key}>
                <CheckCircle2 size={15} />
                {t(key)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-band" aria-label={t("marketing.workflow.label")}>
        {workflowSteps.map((step) => {
          const Icon = step.icon;
          return (
            <article className="marketing-step" key={step.title}>
              <Icon size={20} />
              <h2>{t(step.title)}</h2>
              <p>{t(step.copy)}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export function PricingPage({ language, t, onLanguageChange }: MarketingPageProps) {
  return (
    <main className="marketing-page">
      <MarketingNav active="pricing" language={language} t={t} onLanguageChange={onLanguageChange} />

      <section className="pricing-hero">
        <span className="eyebrow">
          <LockKeyhole size={14} />
          {t("marketing.pricing.eyebrow")}
        </span>
        <h1>{t("marketing.pricing.title")}</h1>
        <p>{t("marketing.pricing.copy")}</p>
      </section>

      <section className="pricing-layout" aria-label={t("marketing.pricing.planLabel")}>
        <article className="pricing-plan">
          <div className="pricing-plan-head">
            <span>{t("marketing.pricing.plan")}</span>
            <strong>{t("marketing.pricing.price")}</strong>
          </div>
          <p>{t("marketing.pricing.planCopy")}</p>
          <ul>
            {planFeatures.map((feature) => (
              <li key={feature}>
                <CheckCircle2 size={16} />
                {t(feature)}
              </li>
            ))}
          </ul>
          <a className="primary-button" href="/login">
            {t("marketing.cta.workspace")}
            <ArrowRight size={18} />
          </a>
        </article>

        <aside className="pricing-note">
          <span className="command-title">
            <ShieldCheck size={16} />
            {t("marketing.pricing.noteTitle")}
          </span>
          <p>{t("marketing.pricing.noteCopy")}</p>
          <a className="text-link-button" href="/login">
            {t("marketing.cta.signIn")}
            <ArrowRight size={16} />
          </a>
        </aside>
      </section>
    </main>
  );
}

function MarketingNav({ active, language, t, onLanguageChange }: MarketingNavProps) {
  return (
    <header className="marketing-nav">
      <a className="marketing-brand" href="/" aria-label={t("product.name")}>
        <span className="rail-logo-mark">
          <FileText size={19} />
        </span>
        <strong>{t("product.name")}</strong>
      </a>
      <nav aria-label={t("marketing.nav.label")}>
        <a aria-current={active === "home" ? "page" : undefined} href="/">
          {t("marketing.nav.home")}
        </a>
        <a aria-current={active === "pricing" ? "page" : undefined} href="/pricing">
          {t("marketing.nav.pricing")}
        </a>
        <a href="/login">{t("marketing.cta.signIn")}</a>
      </nav>
      <LanguageToggle language={language} t={t} onLanguageChange={onLanguageChange} />
    </header>
  );
}
