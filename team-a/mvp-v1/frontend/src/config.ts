import type { AppConfig } from "./types";

export const ROLE_STORAGE_KEY = "news-intel-role";
export const AUTH_TOKEN_STORAGE_KEY = "news-intel-auth-token";
export const AUTH_MODE_STORAGE_KEY = "news-intel-auth-mode";
export const LEGACY_CUSTOM_KEY_STORAGE_KEY = "news-intel-api-key";

export const fallbackConfig: AppConfig = {
  rbac: {
    enabled: true,
    header_name: "X-API-Key",
    cookie_name: "news_brief_api_key",
    default_role: "admin",
    demo_tokens: {
      viewer: "viewer-local-token",
      analyst: "analyst-local-token",
      admin: "admin-local-token",
    },
    roles: [
      { value: "viewer", label: "Viewer", description: "Read saved briefs and exports." },
      { value: "analyst", label: "Analyst", description: "Generate briefs and read exports." },
      { value: "admin", label: "Admin", description: "Manage full handoff access." },
    ],
  },
  persona_options: [],
};
