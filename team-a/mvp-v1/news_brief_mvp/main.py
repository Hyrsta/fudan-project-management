from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, Form, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .auth import (
    PERMISSION_BRIEFS_CREATE,
    PERMISSION_BRIEFS_READ,
    PERMISSION_EXPORTS_READ,
    PERMISSION_HANDOFF_READ,
    RBACSettings,
    load_rbac_settings_from_env,
    rbac_template_context,
    require_permissions,
)
from .models import BriefRequest
from .personas import get_persona_options
from .service import LiveRunFailed, build_default_service


def create_app(
    service=None,
    artifact_root: Optional[Path] = None,
    rbac_settings: Optional[RBACSettings] = None,
) -> FastAPI:
    app_root = Path(__file__).resolve().parent.parent
    templates = Jinja2Templates(directory=str(app_root / "news_brief_mvp" / "templates"))
    app = FastAPI(title="News Intelligence Studio")
    app.mount(
        "/static",
        StaticFiles(directory=str(app_root / "news_brief_mvp" / "static")),
        name="static",
    )
    app.state.service = service or build_default_service(app_root)
    app.state.artifact_root = artifact_root or (app_root / "artifacts")
    app.state.rbac_settings = rbac_settings or load_rbac_settings_from_env()

    def page_context(request: Request, brief=None):
        return {
            "brief": brief,
            "error_message": None,
            "recent_briefs": app.state.service.list_recent_briefs(),
            "persona_options": get_persona_options(),
            "rbac": rbac_template_context(app.state.rbac_settings),
        }

    @app.get("/", response_class=HTMLResponse)
    def index(request: Request):
        return templates.TemplateResponse(request, "index.html", page_context(request))

    @app.post("/api/briefs")
    async def create_brief(
        request: Request,
        _principal=Depends(require_permissions(PERMISSION_BRIEFS_CREATE)),
        topic: Optional[str] = Form(default=None),
        mode: str = Form(default="auto"),
        persona: str = Form(default="research_analyst"),
        goal: str = Form(default=""),
    ):
        payload = (
            await request.json()
            if request.headers.get("content-type", "").startswith("application/json")
            else {"topic": topic or "", "mode": mode, "persona": persona, "goal": goal}
        )
        request_model = BriefRequest.model_validate(payload)

        try:
            brief = app.state.service.generate_brief(request_model)
        except LiveRunFailed as exc:
            if request.headers.get("HX-Request") == "true":
                return templates.TemplateResponse(
                    request,
                    "partials/error.html",
                    {"error_message": str(exc)},
                    status_code=502,
                )
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        if request.headers.get("HX-Request") == "true":
            return templates.TemplateResponse(
                request,
                "partials/brief_result.html",
                {"brief": brief},
            )
        return JSONResponse(content=brief.model_dump(mode="json"))

    @app.get("/briefs/{brief_id}", response_class=HTMLResponse)
    def show_brief(
        request: Request,
        brief_id: str,
        _principal=Depends(require_permissions(PERMISSION_BRIEFS_READ)),
    ):
        try:
            brief = app.state.service.load_brief_response(brief_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Brief not found.") from exc
        if request.headers.get("HX-Request") == "true":
            return templates.TemplateResponse(
                request,
                "partials/brief_result.html",
                {"brief": brief},
            )
        return templates.TemplateResponse(request, "index.html", page_context(request, brief=brief))

    @app.get("/briefs/{brief_id}/export")
    def export_brief(
        brief_id: str,
        _principal=Depends(require_permissions(PERMISSION_EXPORTS_READ)),
    ):
        export_path = app.state.service.get_export_path(brief_id)
        if not export_path.exists():
            raise HTTPException(status_code=404, detail="Export not found.")
        return FileResponse(export_path)

    @app.get("/briefs/{brief_id}/export.md")
    def export_brief_markdown(
        brief_id: str,
        _principal=Depends(require_permissions(PERMISSION_EXPORTS_READ)),
    ):
        markdown_path = app.state.service.get_markdown_path(brief_id)
        if not markdown_path.exists():
            raise HTTPException(status_code=404, detail="Markdown export not found.")
        return FileResponse(markdown_path, media_type="text/markdown")

    @app.get("/briefs/{brief_id}/handoff")
    def handoff_brief(
        brief_id: str,
        _principal=Depends(require_permissions(PERMISSION_HANDOFF_READ)),
    ):
        try:
            handoff = app.state.service.load_handoff(brief_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Structured export not found.") from exc
        return JSONResponse(content=handoff.model_dump(mode="json"))

    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    return app


app = create_app()
