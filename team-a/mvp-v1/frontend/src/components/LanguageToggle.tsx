import { Languages } from "lucide-react";
import type { Language, TFunction } from "../i18n";

type LanguageToggleProps = {
  language: Language;
  t: TFunction;
  onLanguageChange: (language: Language) => void;
};

export function LanguageToggle({ language, t, onLanguageChange }: LanguageToggleProps) {
  return (
    <div className="language-toggle" aria-label={t("language.label")}>
      <span className="language-toggle-icon" aria-hidden="true">
        <Languages size={15} />
      </span>
      <button
        className={`language-toggle-button ${language === "en" ? "is-selected" : ""}`}
        type="button"
        aria-pressed={language === "en"}
        onClick={() => onLanguageChange("en")}
      >
        EN
      </button>
      <button
        className={`language-toggle-button ${language === "zh" ? "is-selected" : ""}`}
        type="button"
        aria-pressed={language === "zh"}
        onClick={() => onLanguageChange("zh")}
      >
        中文
      </button>
    </div>
  );
}
