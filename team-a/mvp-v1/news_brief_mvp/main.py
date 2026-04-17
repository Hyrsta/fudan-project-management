from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from .models import BriefRequest
from .service import LiveRunFailed, build_default_service


def create_app(service=None, artifact_root: Optional[Path] = None) -> FastAPI:
    app_root = Path(__file__).resolve().parent.parent
    templates = Jinja2Templates(directory=str(app_root / "news_brief_mvp" / "templates"))
    app = FastAPI(title="Team A MVP - Analyst Brief App")
    app.state.service = service or build_default_service(app_root)
    app.state.artifact_root = artifact_root or (app_root / "artifacts")

    @app.get("/", response_class=HTMLResponse)
    def index(request: Request):
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "brief": None,
                "error_message": None,
                "recent_briefs": app.state.service.list_recent_briefs(),
            },
        )

    @app.post("/api/briefs")
    async def create_brief(
        request: Request,
        topic: Optional[str] = Form(default=None),
        mode: str = Form(default="auto"),
        persona: str = Form(default="research_analyst"),
    ):
        payload = (
            await request.json()
            if request.headers.get("content-type", "").startswith("application/json")
            else {"topic": topic or "", "mode": mode, "persona": persona}
        )
        request_model = BriefRequest.model_validate(payload)

        try:
            brief = app.state.service.generate_brief(request_model)
        except LiveRunFailed as exc:
            if request.headers.get("HX-Request") == "true":
                return templates.TemplateResponse(
                    "partials/error.html",
                    {"request": request, "error_message": str(exc)},
                    status_code=502,
                )
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        if request.headers.get("HX-Request") == "true":
            return templates.TemplateResponse(
                "partials/brief_result.html",
                {"request": request, "brief": brief},
            )
        return JSONResponse(content=brief.model_dump(mode="json"))

    @app.get("/briefs/{brief_id}", response_class=HTMLResponse)
    def show_brief(request: Request, brief_id: str):
        try:
            brief = app.state.service.load_brief_response(brief_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Brief not found.") from exc
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "brief": brief,
                "error_message": None,
                "recent_briefs": app.state.service.list_recent_briefs(),
            },
        )

    @app.get("/briefs/{brief_id}/export")
    def export_brief(brief_id: str):
        export_path = app.state.service.get_export_path(brief_id)
        if not export_path.exists():
            raise HTTPException(status_code=404, detail="Export not found.")
        return FileResponse(export_path)

    @app.get("/briefs/{brief_id}/handoff")
    def handoff_brief(brief_id: str):
        try:
            handoff = app.state.service.load_handoff(brief_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Handoff artifact not found.") from exc
        return JSONResponse(content=handoff.model_dump(mode="json"))

    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    return app


app = create_app()
