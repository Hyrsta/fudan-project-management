"use strict";
const RBAC_CONFIG = window.NEWS_BRIEF_RBAC_CONFIG || {};
function queryOne(selector, root = document) {
    return root.querySelector(selector);
}
function queryAll(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}
function eventElement(event) {
    return event.target instanceof Element ? event.target : null;
}
function renderIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}
function showToast(message) {
    const region = document.getElementById("toast-region");
    if (!region)
        return;
    region.innerHTML = '<div class="toast-message"><i data-lucide="circle-check" aria-hidden="true"></i><span></span></div>';
    const messageNode = queryOne("span", region);
    if (messageNode)
        messageNode.textContent = message;
    renderIcons();
    window.clearTimeout(window.__newsToastTimer);
    window.__newsToastTimer = window.setTimeout(() => {
        region.innerHTML = "";
    }, 2400);
}
function copyText(text) {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.focus();
    input.select();
    let copied = false;
    try {
        copied = document.execCommand("copy");
    }
    catch {
        copied = false;
    }
    input.remove();
    return copied;
}
function copyLinkFromButton(button, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const url = new URL(button.dataset.url || window.location.href.split("#")[0], window.location.origin).href;
    const copied = copyText(url);
    showToast(copied ? (button.dataset.toast || "Report link copied") : "Use the address bar to copy this report link");
}
function parseSavedBriefs() {
    try {
        const value = JSON.parse(localStorage.getItem("news-intel-saved") || "[]");
        return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
    }
    catch {
        return [];
    }
}
function saveReportFromButton(button, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const briefId = button.dataset.briefId || window.location.pathname.split("/").pop();
    const saved = parseSavedBriefs();
    if (briefId && !saved.includes(briefId)) {
        saved.unshift(briefId);
        localStorage.setItem("news-intel-saved", JSON.stringify(saved.slice(0, 24)));
    }
    setButtonSaved(button);
    showToast("Report saved locally");
}
function toggleSectionFromButton(button, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const targetSelector = button.dataset.target;
    if (!targetSelector)
        return;
    const target = queryOne(targetSelector);
    if (!target)
        return;
    const isExpanded = button.getAttribute("aria-expanded") !== "false";
    target.hidden = isExpanded;
    button.setAttribute("aria-expanded", String(!isExpanded));
    button.innerHTML = `${isExpanded ? "Expand" : "Collapse"} section <i data-lucide="chevron-down" aria-hidden="true"></i>`;
    renderIcons();
}
function openDetailsAndScroll(selector, fallbackMessage) {
    const target = queryOne(selector);
    if (!target) {
        showToast(fallbackMessage);
        return;
    }
    if (target instanceof HTMLDetailsElement) {
        target.open = true;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
}
function scrollToTarget(target, fallbackMessage) {
    if (!target) {
        showToast(fallbackMessage);
        return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
}
function closePanels() {
    queryAll(".utility-panel").forEach((panel) => {
        panel.hidden = true;
    });
}
function openPanel(selector) {
    const panel = queryOne(selector);
    if (!panel)
        return;
    closePanels();
    panel.hidden = false;
    const heading = queryOne("h3", panel);
    if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
    }
}
function focusSearch() {
    const input = document.getElementById("topic-input");
    if (!(input instanceof HTMLInputElement))
        return;
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus();
}
function openCoverage() {
    const comparison = queryOne('[id^="comparison-content-"]');
    const comparisonSection = comparison ? comparison.closest(".comparison-section") : queryOne(".preview-section");
    if (comparison && comparison.hidden) {
        const control = queryOne(`[data-target="#${comparison.id}"]`);
        if (control)
            toggleSectionFromButton(control);
    }
    scrollToTarget(comparisonSection, "Generate a report to compare coverage");
}
function openSources() {
    const evidence = document.getElementById("source-evidence");
    if (evidence instanceof HTMLDetailsElement) {
        evidence.open = true;
        evidence.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }
    openPanel("#trusted-sources-panel");
}
function applySettings() {
    const personaSetting = document.getElementById("settings-persona");
    const modeSetting = document.getElementById("settings-mode");
    const mode = queryOne('select[name="mode"]');
    if (personaSetting instanceof HTMLSelectElement)
        setPersona(personaSetting.value);
    if (modeSetting instanceof HTMLSelectElement && mode)
        mode.value = modeSetting.value;
    localStorage.setItem("news-intel-persona", personaSetting instanceof HTMLSelectElement ? personaSetting.value : "");
    localStorage.setItem("news-intel-mode", modeSetting instanceof HTMLSelectElement ? modeSetting.value : "");
    closePanels();
    showToast("Workspace settings applied");
}
function setPersona(value) {
    let selectedLabel = "";
    let found = false;
    const inputs = queryAll('input[name="persona"]');
    inputs.forEach((input) => {
        const isSelected = input.value === value;
        if (isSelected)
            found = true;
        input.checked = isSelected;
        const card = input.closest("[data-persona-card]");
        if (card)
            card.classList.toggle("is-selected", isSelected);
        if (isSelected) {
            const label = input.closest("[data-persona-card]")?.querySelector("strong");
            selectedLabel = label?.textContent || "";
        }
    });
    if (!found && inputs.length) {
        return setPersona(inputs[0].value);
    }
    const personaSetting = document.getElementById("settings-persona");
    if (personaSetting instanceof HTMLSelectElement && personaSetting.value !== value)
        personaSetting.value = value;
    return selectedLabel;
}
function syncPersonaCards() {
    const checked = queryOne('input[name="persona"]:checked');
    if (checked)
        setPersona(checked.value);
}
function accessRoleMeta(roleValue) {
    return (RBAC_CONFIG.roles || []).find((role) => role.value === roleValue) || {};
}
function activeAccessRole() {
    return localStorage.getItem("news-intel-role") || RBAC_CONFIG.default_role || "admin";
}
function activeAccessToken() {
    if (!RBAC_CONFIG.enabled)
        return "";
    const role = activeAccessRole();
    const demoToken = RBAC_CONFIG.demo_tokens ? RBAC_CONFIG.demo_tokens[role] : "";
    return localStorage.getItem("news-intel-api-key") || demoToken || "";
}
function syncAccessCookie() {
    if (!RBAC_CONFIG.enabled)
        return;
    const token = activeAccessToken();
    const cookieName = RBAC_CONFIG.cookie_name || "news_brief_api_key";
    if (!token) {
        document.cookie = `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
        return;
    }
    document.cookie = `${cookieName}=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
}
function syncAccessUi() {
    if (!RBAC_CONFIG.enabled)
        return;
    const role = activeAccessRole();
    const roleMeta = accessRoleMeta(role);
    const roleSelect = document.getElementById("access-role");
    const roleLabel = document.getElementById("access-role-label");
    const roleAvatar = document.getElementById("access-role-avatar");
    const roleDescription = document.getElementById("access-role-description");
    const keyInput = document.getElementById("access-key-input");
    if (roleSelect instanceof HTMLSelectElement)
        roleSelect.value = role;
    if (roleLabel)
        roleLabel.textContent = roleMeta.label || role;
    if (roleAvatar)
        roleAvatar.textContent = (roleMeta.label || role).slice(0, 2).toUpperCase();
    if (roleDescription)
        roleDescription.textContent = roleMeta.description || "";
    if (keyInput instanceof HTMLInputElement)
        keyInput.value = localStorage.getItem("news-intel-api-key") || "";
    syncAccessCookie();
}
function applyAccessSettings() {
    const roleSelect = document.getElementById("access-role");
    const keyInput = document.getElementById("access-key-input");
    if (roleSelect instanceof HTMLSelectElement)
        localStorage.setItem("news-intel-role", roleSelect.value);
    if (keyInput instanceof HTMLInputElement && keyInput.value.trim()) {
        localStorage.setItem("news-intel-api-key", keyInput.value.trim());
    }
    else {
        localStorage.removeItem("news-intel-api-key");
    }
    syncAccessUi();
    closePanels();
    showToast("Workspace access applied");
}
function applyStoredSettings() {
    const storedPersona = localStorage.getItem("news-intel-persona");
    const storedMode = localStorage.getItem("news-intel-mode");
    const compact = localStorage.getItem("news-intel-compact") === "true";
    const recentOpen = localStorage.getItem("news-intel-recent-open") === "true";
    const mode = queryOne('select[name="mode"]');
    const personaSetting = document.getElementById("settings-persona");
    const modeSetting = document.getElementById("settings-mode");
    const compactSetting = document.getElementById("settings-compact");
    const recentSetting = document.getElementById("settings-recent-open");
    if (storedPersona)
        setPersona(storedPersona);
    if (storedMode && mode)
        mode.value = storedMode;
    if (storedPersona && personaSetting instanceof HTMLSelectElement)
        personaSetting.value = storedPersona;
    if (storedMode && modeSetting instanceof HTMLSelectElement)
        modeSetting.value = storedMode;
    if (compactSetting instanceof HTMLInputElement)
        compactSetting.checked = compact;
    if (recentSetting instanceof HTMLInputElement)
        recentSetting.checked = recentOpen;
    document.body.classList.toggle("compact-mode", compact);
    const recent = document.getElementById("recent-reports");
    if (recent instanceof HTMLDetailsElement && recentOpen)
        recent.open = true;
    syncPersonaCards();
    syncAccessUi();
}
function setButtonSaved(button) {
    button.classList.add("success");
    button.innerHTML = '<i data-lucide="circle-check" aria-hidden="true"></i>Saved';
    renderIcons();
}
async function handleActionClick(event) {
    const button = eventElement(event)?.closest("[data-action]");
    if (!button)
        return;
    const action = button.dataset.action;
    if (button.classList.contains("rail-button")) {
        queryAll(".rail-button").forEach((item) => {
            item.classList.remove("is-active");
        });
        button.classList.add("is-active");
    }
    if (action === "copy-link") {
        copyLinkFromButton(button, event);
        return;
    }
    if (action === "save-report") {
        saveReportFromButton(button, event);
        return;
    }
    if (action === "toggle-more-menu") {
        const menuId = button.getAttribute("aria-controls");
        const menu = menuId ? document.getElementById(menuId) : null;
        if (!menu)
            return;
        const nextOpen = menu.hidden;
        queryAll(".more-dropdown").forEach((item) => {
            item.hidden = true;
        });
        menu.hidden = !nextOpen;
        button.setAttribute("aria-expanded", String(nextOpen));
        return;
    }
    if (action === "toggle-section") {
        toggleSectionFromButton(button, event);
        return;
    }
    if (action === "print-report") {
        window.print();
        return;
    }
    if (action === "focus-search") {
        focusSearch();
        return;
    }
    if (action === "scroll-report") {
        scrollToTarget(document.getElementById("result-panel"), "No report loaded yet");
        return;
    }
    if (action === "open-coverage") {
        openCoverage();
        return;
    }
    if (action === "open-recent") {
        openDetailsAndScroll("#recent-reports", "No recent reports yet");
        return;
    }
    if (action === "scroll-alerts") {
        openDetailsAndScroll("#watch-section", "Generate a report to view alerts");
        return;
    }
    if (action === "open-sources") {
        openSources();
        return;
    }
    if (action === "open-settings") {
        openPanel("#settings-panel");
        return;
    }
    if (action === "open-help") {
        openPanel("#help-panel");
        return;
    }
    if (action === "close-panel") {
        closePanels();
        return;
    }
    if (action === "apply-settings") {
        applySettings();
        return;
    }
    if (action === "apply-access") {
        applyAccessSettings();
        return;
    }
    if (action === "select-persona" && button instanceof HTMLInputElement) {
        const label = setPersona(button.value);
        localStorage.setItem("news-intel-persona", button.value);
        showToast(`${label || "Persona"} lens selected`);
        return;
    }
    if (action === "toggle-density" && button instanceof HTMLInputElement) {
        const checked = Boolean(button.checked);
        document.body.classList.toggle("compact-mode", checked);
        localStorage.setItem("news-intel-compact", String(checked));
        showToast(checked ? "Compact density enabled" : "Comfort density enabled");
        return;
    }
    if (action === "toggle-recent" && button instanceof HTMLInputElement) {
        const checked = Boolean(button.checked);
        localStorage.setItem("news-intel-recent-open", String(checked));
        const recent = document.getElementById("recent-reports");
        if (recent instanceof HTMLDetailsElement)
            recent.open = checked;
        showToast(checked ? "Recent reports stay open" : "Recent reports collapse normally");
        return;
    }
    if (action === "show-profile") {
        openPanel("#profile-panel");
    }
}
function handleActionChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement))
        return;
    if (target.matches('input[name="persona"]') && target instanceof HTMLInputElement) {
        const label = setPersona(target.value);
        localStorage.setItem("news-intel-persona", target.value);
        showToast(`${label || "Persona"} lens selected`);
    }
    if (target.matches("#access-role") && target instanceof HTMLSelectElement) {
        localStorage.setItem("news-intel-role", target.value);
        syncAccessUi();
        showToast(`${accessRoleMeta(target.value).label || "Role"} access selected`);
    }
}
document.addEventListener("click", (event) => {
    if (!eventElement(event)?.closest(".more-menu")) {
        queryAll(".more-dropdown").forEach((item) => {
            item.hidden = true;
        });
        queryAll('[data-action="toggle-more-menu"]').forEach((button) => {
            button.setAttribute("aria-expanded", "false");
        });
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape")
        return;
    queryAll(".more-dropdown").forEach((item) => {
        item.hidden = true;
    });
    queryAll('[data-action="toggle-more-menu"]').forEach((button) => {
        button.setAttribute("aria-expanded", "false");
    });
    closePanels();
});
function initializeUi() {
    renderIcons();
    applyStoredSettings();
}
document.addEventListener("DOMContentLoaded", initializeUi);
document.body.addEventListener("click", handleActionClick);
document.body.addEventListener("change", handleActionChange);
document.body.addEventListener("htmx:configRequest", (event) => {
    const token = activeAccessToken();
    if (token) {
        event.detail.headers[RBAC_CONFIG.header_name || "X-API-Key"] = token;
    }
});
document.body.addEventListener("htmx:responseError", (event) => {
    if ([401, 403].includes(event.detail.xhr.status)) {
        showToast("Access denied for the current role");
    }
});
document.body.addEventListener("htmx:afterSwap", initializeUi);
