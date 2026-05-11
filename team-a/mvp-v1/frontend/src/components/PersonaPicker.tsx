import {
  BriefcaseBusiness,
  ChartLine,
  FileSearch,
  GraduationCap,
  Landmark,
  LucideIcon,
  ShieldAlert,
} from "lucide-react";
import { localizePersona, type Language, type TFunction } from "../i18n";
import type { PersonaOption } from "../types";

const personaIcons: Record<string, LucideIcon> = {
  research_analyst: FileSearch,
  financial_analyst: ChartLine,
  executive_brief: BriefcaseBusiness,
  policy_intelligence: Landmark,
  academic_researcher: GraduationCap,
  risk_analyst: ShieldAlert,
};

type PersonaPickerProps = {
  options: PersonaOption[];
  value: string;
  language: Language;
  t: TFunction;
  onChange: (value: string) => void;
};

export function PersonaPicker({ options, value, language, t, onChange }: PersonaPickerProps) {
  return (
    <div className="persona-panel" aria-label={t("persona.title")}>
      <div className="persona-title">
        <span>{t("persona.title")}</span>
        <p className="helper">{t("persona.helper")}</p>
      </div>
      <div className="persona-grid">
        {options.map((option) => {
          const Icon = personaIcons[option.value] || FileSearch;
          const localized = localizePersona(option, language);
          return (
            <button
              className={`persona-card ${value === option.value ? "is-selected" : ""}`}
              type="button"
              key={option.value}
              onClick={() => onChange(option.value)}
            >
              <span className="persona-icon">
                <Icon size={17} />
              </span>
              <span className="persona-copy">
                <strong>{localized.label}</strong>
                <small>{localized.short}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
