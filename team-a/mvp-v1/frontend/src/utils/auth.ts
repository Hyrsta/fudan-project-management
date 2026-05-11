import {
  AUTH_MODE_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  LEGACY_CUSTOM_KEY_STORAGE_KEY,
  ROLE_STORAGE_KEY,
  fallbackConfig,
} from "../config";
import type { AuthSession, RbacConfig } from "../types";

export function loadStoredAuthSession(): AuthSession | null {
  const token =
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
    localStorage.getItem(LEGACY_CUSTOM_KEY_STORAGE_KEY) ||
    readCookie(fallbackConfig.rbac.cookie_name);

  if (!token) return null;

  return {
    token,
    role: localStorage.getItem(ROLE_STORAGE_KEY) || fallbackConfig.rbac.default_role,
    custom: localStorage.getItem(AUTH_MODE_STORAGE_KEY) === "custom",
  };
}

export function persistAuthSession(session: AuthSession | null, rbac: RbacConfig) {
  if (!rbac.enabled) return;

  if (session?.token) {
    localStorage.setItem(ROLE_STORAGE_KEY, session.role);
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);
    localStorage.setItem(AUTH_MODE_STORAGE_KEY, session.custom ? "custom" : "demo");
    localStorage.removeItem(LEGACY_CUSTOM_KEY_STORAGE_KEY);
    document.cookie = `${rbac.cookie_name}=${encodeURIComponent(session.token)}; Path=/; SameSite=Lax`;
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_MODE_STORAGE_KEY);
  localStorage.removeItem(LEGACY_CUSTOM_KEY_STORAGE_KEY);
  document.cookie = `${rbac.cookie_name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function readCookie(name: string): string {
  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : "";
}
