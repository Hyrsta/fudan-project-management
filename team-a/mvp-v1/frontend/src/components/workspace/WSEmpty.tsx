import type { TFunction } from "../../i18n";

export function WSEmpty({ t }: { t: TFunction }) {
  return (
    <div className="ws-empty">
      <span className="a-smallcaps">{t("ws.sectionBriefing")}</span>
      <h3 className="a-serif ws-empty-title">{t("empty.ready")}</h3>
      <p className="ws-empty-copy">{t("empty.copy")}</p>
    </div>
  );
}
