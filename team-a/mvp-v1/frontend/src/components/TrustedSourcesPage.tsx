import { Plus, RadioTower, Rss, Save, ShieldCheck, Trash2 } from "lucide-react";
import type { Language, TFunction } from "../i18n";
import type { CustomTrustedSource, SourceCatalogItem, TrustedSourceSettings } from "../types";

type TrustedSourcesPageProps = {
  catalog: SourceCatalogItem[];
  settings: TrustedSourceSettings;
  customDraft: CustomTrustedSource;
  canManage: boolean;
  isSaving: boolean;
  error: string;
  language: Language;
  t: TFunction;
  onToggleCatalogSource: (sourceId: string) => void;
  onCustomDraftChange: (field: keyof CustomTrustedSource, value: string) => void;
  onAddCustomSource: () => void;
  onRemoveCustomSource: (sourceId: string) => void;
  onSave: () => void;
};

export function TrustedSourcesPage({
  catalog,
  settings,
  customDraft,
  canManage,
  isSaving,
  error,
  language,
  t,
  onToggleCatalogSource,
  onCustomDraftChange,
  onAddCustomSource,
  onRemoveCustomSource,
  onSave,
}: TrustedSourcesPageProps) {
  const selectedIds = new Set(settings.selected_source_ids);
  const selectedCount = settings.selected_source_ids.length + settings.custom_sources.length;
  const directionLabel = language === "zh" ? "RSS / API" : "RSS / API";

  return (
    <section className="trusted-sources-page" aria-label={t("sources.title")}>
      <div className="trusted-sources-head">
        <div>
          <span className="command-title">
            <RadioTower size={16} />
            {t("sources.title")}
          </span>
          <p className="section-copy">{t("sources.copy")}</p>
        </div>
        <div className="trusted-sources-actions">
          <span className="badge neutral">{t("sources.selectedCount", { count: selectedCount })}</span>
          <button className="primary-button source-save-button" type="button" disabled={!canManage || isSaving} onClick={onSave}>
            <Save size={16} />
            {isSaving ? t("sources.saving") : t("sources.save")}
          </button>
        </div>
      </div>

      {!canManage && <p className="source-permission-note">{t("sources.viewerNotice")}</p>}
      {error && <div className="error-banner">{error}</div>}

      <div className="trusted-sources-layout">
        <section className="source-catalog-panel" aria-label={t("sources.catalog")}>
          <div className="section-head compact">
            <h2>{t("sources.catalog")}</h2>
            <span className="meta-pill">
              <ShieldCheck size={14} />
              {t("sources.globalPreference")}
            </span>
          </div>

          <div className="source-catalog-list">
            {catalog.length ? (
              catalog.map((source) => {
                const selected = selectedIds.has(source.id);
                return (
                  <button
                    className={`source-catalog-row ${selected ? "is-selected" : ""}`}
                    type="button"
                    key={source.id}
                    disabled={!canManage}
                    aria-pressed={selected}
                    onClick={() => onToggleCatalogSource(source.id)}
                  >
                    <span className="source-trust-marker">
                      {selected ? <ShieldCheck size={16} /> : <RadioTower size={16} />}
                    </span>
                    <span className="source-catalog-main">
                      <strong>{source.name}</strong>
                      <small>{source.domain || source.feed_url || directionLabel}</small>
                    </span>
                    <span className="source-catalog-meta">
                      <span>{t("sources.category", { category: source.category, region: source.region })}</span>
                      {source.feed_url && (
                        <span className="source-feed-chip">
                          <Rss size={13} />
                          {t("sources.feedReady")}
                        </span>
                      )}
                      {source.subscription_note && <span>{t("sources.subscriptionNote")}</span>}
                    </span>
                    <span className="source-state-chip">{selected ? t("sources.trusted") : t("sources.available")}</span>
                  </button>
                );
              })
            ) : (
              <p className="history-empty">{t("sources.available")}</p>
            )}
          </div>
        </section>

        <aside className="custom-sources-panel" aria-label={t("sources.custom")}>
          <div className="section-head compact">
            <h2>{t("sources.custom")}</h2>
            <span className="badge neutral">{settings.custom_sources.length}</span>
          </div>
          <p className="section-copy">{t("sources.customHelp")}</p>

          <div className="custom-source-form" aria-label={t("sources.formTitle")}>
            <label>
              <span>{t("sources.name")}</span>
              <input
                value={customDraft.name}
                disabled={!canManage}
                placeholder={t("sources.namePlaceholder")}
                onChange={(event) => onCustomDraftChange("name", event.target.value)}
              />
            </label>
            <label>
              <span>{t("sources.domain")}</span>
              <input
                value={customDraft.domain}
                disabled={!canManage}
                placeholder={t("sources.domainPlaceholder")}
                onChange={(event) => onCustomDraftChange("domain", event.target.value)}
              />
            </label>
            <label>
              <span>{t("sources.feedUrl")}</span>
              <input
                value={customDraft.feed_url}
                disabled={!canManage}
                placeholder={t("sources.feedPlaceholder")}
                onChange={(event) => onCustomDraftChange("feed_url", event.target.value)}
              />
            </label>
            <button className="secondary-button" type="button" disabled={!canManage} onClick={onAddCustomSource}>
              <Plus size={16} />
              {t("sources.addCustom")}
            </button>
          </div>

          <div className="custom-source-list">
            {settings.custom_sources.length ? (
              settings.custom_sources.map((source) => (
                <div className="custom-source-row" key={source.id || source.name}>
                  <span>
                    <strong>{source.name}</strong>
                    <small>{source.domain || source.feed_url}</small>
                  </span>
                  {canManage && (
                    <button
                      className="history-delete-button"
                      type="button"
                      title={t("sources.removeCustom")}
                      aria-label={t("sources.removeCustom")}
                      onClick={() => onRemoveCustomSource(source.id || source.name)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="history-empty">{t("sources.noCustomSources")}</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
