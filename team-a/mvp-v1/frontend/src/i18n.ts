import type { PersonaOption } from "./types";

export type Language = "en" | "zh";
export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_STORAGE_KEY = "news-intel-language";

const english = {
  "language.label": "Language",
  "language.english": "English",
  "language.chinese": "中文",
  "product.name": "News Intelligence Studio",
  "product.online": "Local service online",
  "product.description": "Source-ranked reports, persona lenses, and local handoff exports in one controlled workspace.",
  "app.commandCenter": "Analyst command center",
  "app.localDataSynced": "Local data synced",
  "nav.workspace": "Workspace navigation",
  "nav.primary": "Primary workspace navigation",
  "nav.newBrief": "New brief",
  "nav.recentBriefs": "Recent briefs",
  "profile.session": "Local workspace session",
  "profile.roleDetails": "Role details",
  "profile.roleHint": "Current role controls route access",
  "profile.signOut": "Sign out",
  "auth.signInLabel": "Sign in",
  "auth.secureLocalAccess": "Secure local access",
  "auth.enterWorkspace": "Enter workspace",
  "auth.demoDescription": "Open the local demo with report generation, saved briefs, exports, and handoff access enabled.",
  "auth.signingIn": "Signing in",
  "auth.enterDemoWorkspace": "Enter demo workspace",
  "auth.useApiKey": "Use API key",
  "auth.apiKey": "API key",
  "auth.useDemoWorkspace": "Use demo workspace",
  "error.demoNotConfigured": "Demo access is not configured.",
  "error.enterApiKey": "Enter an API key.",
  "error.signInFailed": "Could not sign in.",
  "error.configLoad": "Could not load workspace configuration.",
  "error.accessRejected": "Access key was rejected.",
  "error.generateFailed": "Could not generate the brief.",
  "error.openFailed": "Could not open the brief.",
  "error.deleteFailed": "Could not delete the brief.",
  "error.deleteConfirm": "Delete this saved brief and its exports?",
  "error.requestFailed": "Request failed with {status}",
  "toast.signedIn": "Signed in",
  "toast.signedOut": "Signed out",
  "toast.briefGenerated": "Brief generated",
  "toast.briefLoaded": "Brief loaded",
  "toast.briefDeleted": "Brief deleted",
  "composer.title": "Research command",
  "composer.controls": "Report controls",
  "composer.copy": "Topic, lens, source mode, output.",
  "composer.sourceSync": "Trusted RSS + local fallback",
  "composer.topicPlaceholder": "Research a topic or story",
  "composer.topicLabel": "Topic",
  "composer.goalPlaceholder": "Optional: decision or question this report should answer",
  "composer.generate": "Generate",
  "composer.generating": "Generating",
  "composer.coverage": "Source mode",
  "composer.coverageAuto": "Balanced",
  "composer.coverageLive": "Live",
  "composer.coverageFallback": "Saved",
  "composer.quickTopics": "Example topics",
  "composer.quickTopic.chips": "AI chip export controls",
  "composer.quickTopic.inflation": "US inflation outlook",
  "composer.quickTopic.models": "Open-source AI model competition",
  "persona.title": "Persona lens",
  "persona.helper": "Select the briefing logic.",
  "recent.title": "Recent briefs",
  "recent.empty": "Generated briefs appear here.",
  "recent.deleteTitle": "Delete brief",
  "recent.deleteAria": "Delete {topic}",
  "recent.savedBrief": "Saved brief",
  "recent.live": "Live",
  "recent.saved": "Saved",
  "history.title": "Brief history",
  "history.copy": "Saved reports, source mode, source counts, and handoff-ready exports.",
  "history.count": "{count} briefs",
  "history.tableLabel": "Saved brief history",
  "history.topic": "Topic",
  "history.persona": "Persona",
  "history.coverage": "Source mode",
  "history.created": "Created",
  "history.sources": "Sources",
  "history.actions": "Actions",
  "history.open": "Open",
  "history.empty": "Generated briefs appear here.",
  "report.ready": "Ready",
  "report.savedCoverage": "Saved sources",
  "report.liveCoverage": "Live sources",
  "report.sources": "{count} sources",
  "report.actions": "Report actions",
  "report.exportHtml": "HTML",
  "report.exportMarkdown": "Markdown",
  "report.exportHandoff": "Handoff",
  "report.executiveSummary": "Executive summary",
  "report.takeaways": "Takeaways",
  "report.keyFacts": "Key facts",
  "report.signals": "Signals",
  "report.watch": "Watch",
  "report.coverageNote": "Coverage note",
  "report.sourceListLabel": "Selected sources list",
  "report.sourceEvidence": "Source evidence",
  "report.selected": "{count} selected",
  "report.rank": "Rank {score}",
  "report.fresh": "Fresh {score}",
  "report.fit": "Fit {score}",
  "report.source": "Source",
  "report.evidence": "Evidence",
  "report.confidenceSources": "Sources",
  "report.confidenceFreshness": "Freshness",
  "report.confidenceTopicFit": "Topic fit",
  "empty.sourceAware": "Source aware",
  "empty.ready": "Ready for a briefing",
  "empty.copy": "Enter a topic, choose a lens, and generate a source-ranked report.",
  "empty.capabilities": "Report capabilities",
  "empty.evidence": "Evidence",
  "empty.comparison": "Comparison",
  "empty.watch": "Watch",
  "empty.exports": "Exports",
  "role.viewer": "Viewer",
  "role.analyst": "Analyst",
  "role.admin": "Admin",
} as const;

export type TranslationKey = keyof typeof english;

const chinese: Record<TranslationKey, string> = {
  "language.label": "语言",
  "language.english": "English",
  "language.chinese": "中文",
  "product.name": "新闻情报工作台",
  "product.online": "本地服务在线",
  "product.description": "在一个受控工作区中生成按来源排序的报告、切换分析视角，并导出本地交接文件。",
  "app.commandCenter": "分析师指挥中心",
  "app.localDataSynced": "本地数据已同步",
  "nav.workspace": "工作区导航",
  "nav.primary": "主要工作区导航",
  "nav.newBrief": "新建简报",
  "nav.recentBriefs": "最近简报",
  "profile.session": "本地工作区会话",
  "profile.roleDetails": "角色详情",
  "profile.roleHint": "当前角色决定可访问的功能",
  "profile.signOut": "退出登录",
  "auth.signInLabel": "登录",
  "auth.secureLocalAccess": "安全本地访问",
  "auth.enterWorkspace": "进入工作区",
  "auth.demoDescription": "使用本地演示工作区，支持生成报告、查看保存简报、导出文件和交接访问。",
  "auth.signingIn": "正在登录",
  "auth.enterDemoWorkspace": "进入演示工作区",
  "auth.useApiKey": "使用 API 密钥",
  "auth.apiKey": "API 密钥",
  "auth.useDemoWorkspace": "使用演示工作区",
  "error.demoNotConfigured": "演示访问尚未配置。",
  "error.enterApiKey": "请输入 API 密钥。",
  "error.signInFailed": "无法登录。",
  "error.configLoad": "无法加载工作区配置。",
  "error.accessRejected": "访问密钥被拒绝。",
  "error.generateFailed": "无法生成简报。",
  "error.openFailed": "无法打开简报。",
  "error.deleteFailed": "无法删除简报。",
  "error.deleteConfirm": "删除这份已保存简报及其导出文件？",
  "error.requestFailed": "请求失败，状态码 {status}",
  "toast.signedIn": "已登录",
  "toast.signedOut": "已退出",
  "toast.briefGenerated": "简报已生成",
  "toast.briefLoaded": "简报已加载",
  "toast.briefDeleted": "简报已删除",
  "composer.title": "研究指令",
  "composer.controls": "报告控制",
  "composer.copy": "设置主题、视角、来源模式和输出。",
  "composer.sourceSync": "可信 RSS + 本地兜底",
  "composer.topicPlaceholder": "输入要研究的主题或新闻",
  "composer.topicLabel": "主题",
  "composer.goalPlaceholder": "可选：这份报告要回答的决策或问题",
  "composer.generate": "生成",
  "composer.generating": "生成中",
  "composer.coverage": "来源模式",
  "composer.coverageAuto": "平衡",
  "composer.coverageLive": "实时",
  "composer.coverageFallback": "已保存",
  "composer.quickTopics": "示例主题",
  "composer.quickTopic.chips": "AI 芯片出口管制",
  "composer.quickTopic.inflation": "美国通胀前景",
  "composer.quickTopic.models": "开源 AI 模型竞争",
  "persona.title": "分析视角",
  "persona.helper": "选择简报分析逻辑。",
  "recent.title": "最近简报",
  "recent.empty": "生成后的简报会显示在这里。",
  "recent.deleteTitle": "删除简报",
  "recent.deleteAria": "删除 {topic}",
  "recent.savedBrief": "已保存简报",
  "recent.live": "实时",
  "recent.saved": "已保存",
  "history.title": "简报历史",
  "history.copy": "已保存报告、来源模式、来源数量和可交接导出。",
  "history.count": "{count} 份简报",
  "history.tableLabel": "已保存简报历史",
  "history.topic": "主题",
  "history.persona": "视角",
  "history.coverage": "来源模式",
  "history.created": "创建时间",
  "history.sources": "来源",
  "history.actions": "操作",
  "history.open": "打开",
  "history.empty": "生成后的简报会显示在这里。",
  "report.ready": "就绪",
  "report.savedCoverage": "已保存来源",
  "report.liveCoverage": "实时来源",
  "report.sources": "{count} 个来源",
  "report.actions": "报告操作",
  "report.exportHtml": "HTML",
  "report.exportMarkdown": "Markdown",
  "report.exportHandoff": "交接",
  "report.executiveSummary": "执行摘要",
  "report.takeaways": "要点",
  "report.keyFacts": "关键事实",
  "report.signals": "信号",
  "report.watch": "观察点",
  "report.coverageNote": "覆盖说明",
  "report.sourceListLabel": "所选来源列表",
  "report.sourceEvidence": "来源证据",
  "report.selected": "已选 {count} 个",
  "report.rank": "排名 {score}",
  "report.fresh": "新鲜度 {score}",
  "report.fit": "匹配度 {score}",
  "report.source": "来源",
  "report.evidence": "证据",
  "report.confidenceSources": "来源",
  "report.confidenceFreshness": "时效性",
  "report.confidenceTopicFit": "主题匹配",
  "empty.sourceAware": "来源感知",
  "empty.ready": "准备生成简报",
  "empty.copy": "输入主题、选择视角，然后生成按来源排序的报告。",
  "empty.capabilities": "报告能力",
  "empty.evidence": "证据",
  "empty.comparison": "对比",
  "empty.watch": "观察",
  "empty.exports": "导出",
  "role.viewer": "查看者",
  "role.analyst": "分析师",
  "role.admin": "管理员",
};

const personaLabels: Record<Language, Record<string, { label: string; short: string }>> = {
  en: {},
  zh: {
    research_analyst: { label: "研究分析师", short: "来源排序、证据和关键要点。" },
    financial_analyst: { label: "金融分析师", short: "市场影响、风险敞口和投资信号。" },
    executive_brief: { label: "高管简报", short: "决策摘要、取舍和下一步行动。" },
    policy_intelligence: { label: "政策情报", short: "监管意图、利益相关方和地缘影响。" },
    academic_researcher: { label: "学术研究者", short: "方法、证据质量和研究空白。" },
    risk_analyst: { label: "风险分析师", short: "威胁、脆弱性和缓解措施。" },
  },
};

const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  en: english,
  zh: chinese,
};

export type TFunction = (key: TranslationKey, values?: Record<string, string | number>) => string;

export function createTranslator(language: Language): TFunction {
  const dictionary = dictionaries[language] || dictionaries[DEFAULT_LANGUAGE];
  return (key, values) => interpolate(dictionary[key] || dictionaries[DEFAULT_LANGUAGE][key], values);
}

export function loadStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function persistLanguage(language: Language) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function normalizeLanguage(value: string | null | undefined): Language {
  return value === "zh" ? "zh" : DEFAULT_LANGUAGE;
}

export function htmlLang(language: Language) {
  return language === "zh" ? "zh-CN" : "en";
}

export function formatDate(value: string, language: Language, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(language === "zh" ? "zh-CN" : undefined, options);
}

export function localizeRole(role: string, language: Language, fallback: string) {
  const key = `role.${role}` as TranslationKey;
  return dictionaries[language][key] || fallback;
}

export function localizePersona(option: PersonaOption, language: Language) {
  return personaLabels[language][option.value] || { label: option.label, short: option.short };
}

function interpolate(template: string, values: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
