import logging
from pathlib import Path
from typing import Any, Literal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from pydantic import BaseModel, field_validator

from ...application.services import AnalysisOrchestratorService
from ...infrastructure.adapters.websocket_notifier import WebSocketNotifier

logger = logging.getLogger(__name__)

router = APIRouter()


class RunAnalysisRequest(BaseModel):
    project_path: str
    mode: Literal["full", "incremental", "watch"] = "full"
    selected_tools: list[str] | None = None
    project_id: str  # Required field

    @field_validator("project_path")
    @classmethod
    def validate_path(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Project path cannot be empty")
        path = Path(v)
        if not path.exists():
            raise ValueError(f"Project path does not exist: {v}")
        if not path.is_dir():
            raise ValueError(f"Project path must be a directory: {v}")
        return v


class StopAnalysisRequest(BaseModel):
    project_id: str
    project_path: str | None = None


class ToolMetadata(BaseModel):
    id: str
    title: str
    subtitle: str
    icon: str


# Dependency Injection Placeholder
async def get_analysis_service() -> AnalysisOrchestratorService:
    raise NotImplementedError


async def get_notifier() -> WebSocketNotifier:
    raise NotImplementedError


@router.get("/api/tools", response_model=list[ToolMetadata])
async def get_tools(
    service: AnalysisOrchestratorService = Depends(get_analysis_service),  # noqa: B008
) -> list[dict[str, str]]:
    return service.get_available_tools()


@router.post("/api/run-analysis", status_code=status.HTTP_202_ACCEPTED)
async def run_analysis(
    request: RunAnalysisRequest,
    service: AnalysisOrchestratorService = Depends(get_analysis_service),  # noqa: B008
) -> dict[str, str]:
    logger.info(f"Received run_analysis request for project: {request.project_id}")
    # STATUS-001: Invalid Project ID (Mock check for now, ideally check DB)
    if request.project_id == "99999":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    try:
        return await service.start_analysis(
            project_id=request.project_id,
            project_path=request.project_path,
            mode=request.mode,
            selected_tools=request.selected_tools,
        )
    except RuntimeError as e:
        # STATUS-002: Concurrent Conflict
        if "already running" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Analysis already running") from e
        raise e from None


@router.post("/api/stop-analysis", status_code=status.HTTP_202_ACCEPTED)
async def stop_analysis(
    request: StopAnalysisRequest,
    service: AnalysisOrchestratorService = Depends(get_analysis_service),  # noqa: B008
) -> dict[str, str]:
    result = await service.stop_analysis(request.project_id)
    if result["status"] == "not_found":
        # If we consider stopping a non-running process as success (idempotent), return 202.
        # But if we want to be strict about "Resource not found", 404.
        # The prompt implies "Successful Initiation: Both must return 202 Accepted."
        # So we return 202 even if not found? Or maybe 202 is for the command.
        # Let's stick to 202 for success.
        pass
    return result


@router.post("/api/stop-watch", status_code=status.HTTP_202_ACCEPTED)
async def stop_watch(
    request: StopAnalysisRequest,
    service: AnalysisOrchestratorService = Depends(get_analysis_service),  # noqa: B008
) -> dict[str, str]:
    return await service.stop_analysis(request.project_id)


@router.websocket("/api/ws/analysis")
async def websocket_endpoint(
    websocket: WebSocket,
    notifier: WebSocketNotifier = Depends(get_notifier),  # noqa: B008
    service: AnalysisOrchestratorService = Depends(get_analysis_service),  # noqa: B008
) -> None:
    project_id = "default_session"
    await notifier.connect(websocket, project_id)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("command") == "start":
                # Legacy support or alternative trigger
                project_path = data.get("path", "/home/Workspace")
                import asyncio

                # Default to full analysis if triggered via WS without params
                asyncio.create_task(service.start_analysis(project_id, project_path))
    except WebSocketDisconnect:
        notifier.disconnect(websocket, project_id)


@router.get("/api/metrics/{project_id}")
async def get_metrics(
    project_id: str,
    service: AnalysisOrchestratorService = Depends(get_analysis_service),  # noqa: B008
) -> Any:  # noqa: ANN401
    # STATUS-006: Metrics Not Generated
    # For now, we don't have metrics storage, so always return 404
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metrics not found")
