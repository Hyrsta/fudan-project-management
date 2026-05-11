import {
  BriefcaseBusiness,
  ChartLine,
  FileSearch,
  GraduationCap,
  Landmark,
  LucideIcon,
  ShieldAlert,
} from "lucide-react";
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
  onChange: (value: string) => void;
};

export function PersonaPicker({ options, value, onChange }: PersonaPickerProps) {
  return (
    <div className="persona-panel" aria-label="Report lens">
      <div className="persona-title">
        <span>Persona lens</span>
        <p className="helper">Select the briefing logic.</p>
      </div>
      <div className="persona-grid">
        {options.map((option) => {
          const Icon = personaIcons[option.value] || FileSearch;
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
                <strong>{option.label}</strong>
                <small>{option.short}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
