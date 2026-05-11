import { AlertTriangle, RadioTower, Search, Sparkles, Target } from "lucide-react";
import { FormEvent } from "react";
import type { PersonaOption } from "../types";
import { PersonaPicker } from "./PersonaPicker";

type BriefComposerProps = {
  topic: string;
  goal: string;
  mode: string;
  persona: string;
  personaOptions: PersonaOption[];
  isLoading: boolean;
  error: string;
  onTopicChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onModeChange: (value: string) => void;
  onPersonaChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

const quickTopics = [
  "AI chip export controls",
  "US inflation outlook",
  "Open-source AI model competition",
];

export function BriefComposer({
  topic,
  goal,
  mode,
  persona,
  personaOptions,
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
    <section className="command-panel" aria-label="Report controls">
      <div className="command-head">
        <div>
          <span className="command-title">
            <Search size={16} />
            Research command
          </span>
          <p className="section-copy">Topic, lens, coverage, output.</p>
        </div>
        <span className="status-chip source-sync">Trusted RSS + local fallback</span>
      </div>

      <form className="brief-form" onSubmit={onSubmit} aria-busy={isLoading}>
        <div className="topic-row">
          <label className="sr-only" htmlFor="topic-input">
            Topic
          </label>
          <div className="input-shell command-input">
            <Search size={18} aria-hidden="true" />
            <input
              id="topic-input"
              type="text"
              name="topic"
              placeholder="Research a topic or story"
              autoComplete="off"
              value={topic}
              onChange={(event) => onTopicChange(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="primary-button" disabled={isLoading}>
            <Sparkles size={18} aria-hidden="true" />
            {isLoading ? "Generating" : "Generate"}
          </button>
        </div>

        <div className="goal-row">
          <div className="input-shell">
            <Target size={18} aria-hidden="true" />
            <input
              type="text"
              name="goal"
              placeholder="Optional: decision or question this report should answer"
              autoComplete="off"
              value={goal}
              onChange={(event) => onGoalChange(event.target.value)}
            />
          </div>
        </div>

        <PersonaPicker options={personaOptions} value={persona} onChange={onPersonaChange} />

        <div className="control-row">
          <label className="select-shell">
            <span>
              <RadioTower size={16} />
              Coverage
            </span>
            <select value={mode} onChange={(event) => onModeChange(event.target.value)}>
              <option value="auto">Balanced coverage</option>
              <option value="live">Live sources</option>
              <option value="fallback">Saved source set</option>
            </select>
          </label>
          <div className="quick-topics" aria-label="Example topics">
            {quickTopics.map((item) => (
              <button className="topic-chip" type="button" key={item} onClick={() => applyQuickTopic(item)}>
                {item}
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
