import { AlertTriangle, RadioTower, Search, Sparkles, Target } from "lucide-react";
import { FormEvent } from "react";
import type { Language, TFunction } from "../i18n";
import type { PersonaOption } from "../types";
import { PersonaPicker } from "./PersonaPicker";

type BriefComposerProps = {
  topic: string;
  goal: string;
  mode: string;
  persona: string;
  personaOptions: PersonaOption[];
  language: Language;
  t: TFunction;
  isLoading: boolean;
  error: string;
  onTopicChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onModeChange: (value: string) => void;
  onPersonaChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const quickTopics = [
  { key: "composer.quickTopic.chips" },
  { key: "composer.quickTopic.inflation" },
  { key: "composer.quickTopic.models" },
] as const;

export function BriefComposer({
  topic,
  goal,
  mode,
  persona,
  personaOptions,
  language,
  t,
  isLoading,
  error,
  onTopicChange,
  onGoalChange,
  onModeChange,
  onPersonaChange,
  onSubmit,
}: BriefComposerProps) {
  function applyQuickTopic(value: string) {
    onTopicChange(value);
    window.setTimeout(() => document.getElementById("topic-input")?.focus(), 0);
  }

  return (
    <section className="command-panel" id="brief-composer" aria-label={t("composer.controls")}>
      <div className="command-head">
        <div>
          <span className="command-title">
            <Search size={16} />
            {t("composer.title")}
          </span>
          <p className="section-copy">{t("composer.copy")}</p>
        </div>
        <span className="status-chip source-sync">{t("composer.sourceSync")}</span>
      </div>

      <form className="brief-form" onSubmit={onSubmit} aria-busy={isLoading}>
        <div className="topic-row">
          <label className="sr-only" htmlFor="topic-input">
            {t("composer.topicLabel")}
          </label>
          <div className="input-shell command-input">
            <Search size={18} aria-hidden="true" />
            <input
              id="topic-input"
              type="text"
              name="topic"
              placeholder={t("composer.topicPlaceholder")}
              autoComplete="off"
              value={topic}
              onChange={(event) => onTopicChange(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="primary-button" disabled={isLoading}>
            <Sparkles size={18} aria-hidden="true" />
            {isLoading ? t("composer.generating") : t("composer.generate")}
          </button>
        </div>

        <div className="goal-row">
          <div className="input-shell">
            <Target size={18} aria-hidden="true" />
            <input
              type="text"
              name="goal"
              placeholder={t("composer.goalPlaceholder")}
              autoComplete="off"
              value={goal}
              onChange={(event) => onGoalChange(event.target.value)}
            />
          </div>
        </div>

        <PersonaPicker options={personaOptions} value={persona} language={language} t={t} onChange={onPersonaChange} />

        <div className="control-row">
          <label className="select-shell">
            <span>
              <RadioTower size={16} />
              {t("composer.coverage")}
            </span>
            <select value={mode} onChange={(event) => onModeChange(event.target.value)}>
              <option value="auto">{t("composer.coverageAuto")}</option>
              <option value="live">{t("composer.coverageLive")}</option>
              <option value="fallback">{t("composer.coverageFallback")}</option>
            </select>
          </label>
          <div className="quick-topics" aria-label={t("composer.quickTopics")}>
            {quickTopics.map((item) => (
              <button className="topic-chip" type="button" key={item.key} onClick={() => applyQuickTopic(t(item.key))}>
                {t(item.key)}
              </button>
            ))}
          </div>
        </div>
      </form>

      {error && (
        <div className="error-banner" role="alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}
    </section>
  );
}
