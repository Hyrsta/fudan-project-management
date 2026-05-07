from __future__ import annotations

import os
import secrets
from dataclasses import dataclass, field
from typing import Dict, FrozenSet, Literal, Mapping, Optional, Tuple

from fastapi import HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader


Role = Literal["viewer", "analyst", "admin"]
Permission = Literal["briefs:read", "briefs:create", "exports:read", "handoff:read"]

PERMISSION_BRIEFS_READ: Permission = "briefs:read"
PERMISSION_BRIEFS_CREATE: Permission = "briefs:create"
PERMISSION_EXPORTS_READ: Permission = "exports:read"
PERMISSION_HANDOFF_READ: Permission = "handoff:read"

HEADER_NAME = "X-API-Key"
COOKIE_NAME = "news_brief_api_key"

DEMO_TOKEN_ROLES: Dict[str, Role] = {
    "viewer-local-token": "viewer",
    "analyst-local-token": "analyst",
    "admin-local-token": "admin",
}

ROLE_PERMISSIONS: Dict[Role, FrozenSet[Permission]] = {
    "viewer": frozenset({PERMISSION_BRIEFS_READ, PERMISSION_EXPORTS_READ}),
    "analyst": frozenset({PERMISSION_BRIEFS_READ, PERMISSION_BRIEFS_CREATE, PERMISSION_EXPORTS_READ}),
    "admin": frozenset(
        {
            PERMISSION_BRIEFS_READ,
            PERMISSION_BRIEFS_CREATE,
            PERMISSION_EXPORTS_READ,
            PERMISSION_HANDOFF_READ,
        }
    ),
}

ROLE_LABELS: Dict[Role, Tuple[str, str]] = {
    "viewer": ("Viewer", "Read saved briefs and exports."),
    "analyst": ("Analyst", "Generate briefs and read exports."),
    "admin": ("Admin", "Manage full handoff access."),
}

api_key_header = APIKeyHeader(name=HEADER_NAME, auto_error=False)


@dataclass(frozen=True)
class RBACSettings:
    enabled: bool = True
    token_roles: Mapping[str, Role] = field(default_factory=lambda: dict(DEMO_TOKEN_ROLES))
    header_name: str = HEADER_NAME
    cookie_name: str = COOKIE_NAME
    default_role: Role = "admin"
    expose_demo_tokens: bool = True


@dataclass(frozen=True)
class RBACPrincipal:
    token: str
    role: Role
    permissions: FrozenSet[Permission]


LOCAL_ADMIN_PRINCIPAL = RBACPrincipal(
    token="",
    role="admin",
    permissions=ROLE_PERMISSIONS["admin"],
)


def load_rbac_settings_from_env(env: Optional[Mapping[str, str]] = None) -> RBACSettings:
    source = env or os.environ
    raw_tokens = source.get(
        "NEWS_BRIEF_RBAC_TOKENS",
        source.get("NEWS_BRIEF_API_TOKENS", ""),
    ).strip()
    token_roles = parse_token_roles(raw_tokens) if raw_tokens else dict(DEMO_TOKEN_ROLES)
    return RBACSettings(
        enabled=_parse_bool(source.get("NEWS_BRIEF_RBAC_ENABLED", "true")),
        token_roles=token_roles,
        header_name=source.get("NEWS_BRIEF_RBAC_HEADER", HEADER_NAME),
        cookie_name=source.get("NEWS_BRIEF_RBAC_COOKIE", COOKIE_NAME),
        default_role=_parse_role(source.get("NEWS_BRIEF_RBAC_DEFAULT_ROLE", "admin")),
        expose_demo_tokens=not raw_tokens,
    )


def parse_token_roles(raw_tokens: str) -> Dict[str, Role]:
    token_roles: Dict[str, Role] = {}
    for raw_entry in raw_tokens.replace(",", ";").split(";"):
        entry = raw_entry.strip()
        if not entry:
            continue
        if "=" in entry:
            separator = "="
        elif ":" in entry:
            separator = ":"
        else:
            raise ValueError("RBAC token entries must use role:token or role=token format.")
        try:
            role_value, token = [part.strip() for part in entry.split(separator, 1)]
        except ValueError as exc:
            raise ValueError("RBAC token entries must use role:token or role=token format.") from exc
        role = _parse_role(role_value)
        if not token:
            raise ValueError("RBAC token entries require a token value.")
        if token in token_roles:
            raise ValueError("Duplicate RBAC token configured.")
        token_roles[token] = role
    return token_roles


def rbac_template_context(settings: RBACSettings) -> Dict[str, object]:
    demo_tokens: Dict[str, str] = {}
    if settings.enabled and settings.expose_demo_tokens:
        demo_tokens = {role: token for token, role in settings.token_roles.items()}

    return {
        "enabled": settings.enabled,
        "header_name": settings.header_name,
        "cookie_name": settings.cookie_name,
        "default_role": settings.default_role,
        "demo_tokens": demo_tokens,
        "roles": [
            {"value": role, "label": label, "description": description}
            for role, (label, description) in ROLE_LABELS.items()
        ],
    }


def require_permissions(*permissions: Permission):
    required_permissions = frozenset(permissions)

    def dependency(
        request: Request,
        api_key: Optional[str] = Security(api_key_header),
    ) -> RBACPrincipal:
        settings: RBACSettings = getattr(request.app.state, "rbac_settings", RBACSettings())
        principal = authenticate_request(request, settings, api_key)
        missing_permissions = required_permissions.difference(principal.permissions)
        if missing_permissions:
            missing = ", ".join(sorted(missing_permissions))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{principal.role}' is missing required permission(s): {missing}.",
            )
        return principal

    return dependency


def authenticate_request(
    request: Request,
    settings: RBACSettings,
    api_key: Optional[str],
) -> RBACPrincipal:
    if not settings.enabled:
        return LOCAL_ADMIN_PRINCIPAL

    token = _extract_token(request, settings, api_key)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    role = _lookup_role(token, settings.token_roles)
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    return RBACPrincipal(token=token, role=role, permissions=ROLE_PERMISSIONS[role])


def _extract_token(
    request: Request,
    settings: RBACSettings,
    api_key: Optional[str],
) -> str:
    header_token = request.headers.get(settings.header_name) or api_key
    if header_token:
        return header_token
    return request.cookies.get(settings.cookie_name, "")


def _lookup_role(token: str, token_roles: Mapping[str, Role]) -> Optional[Role]:
    for expected_token, role in token_roles.items():
        if secrets.compare_digest(token, expected_token):
            return role
    return None


def _parse_role(role: str) -> Role:
    normalized = role.strip().lower()
    if normalized not in ROLE_PERMISSIONS:
        raise ValueError(f"Unsupported RBAC role: {role}")
    return normalized  # type: ignore[return-value]


def _parse_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}
