from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from ...application.services import AnalysisOrchestratorService
from ...infrastructure.adapters.websocket_notifier import WebSocketNotifier

router = APIRouter()


class RunAnalysisRequest(BaseModel):
    project_path: str
    mode: Literal["full", "incremental", "watch"] = "full"
    selected_tools: Optional[List[str]] = None
    project_id: str = "default"  # Frontend might not send this in the body, but we need it.
    # If frontend doesn't send it, we might need to generate or infer it.
    # The WebSocket connection uses project_id.
    # Let's assume for now we use a default or extract from path if possible.
    # But the frontend request body shown in useAnalysisControl.ts DOES NOT include project_id.
    # It only sends project_path, mode, selected_tools.
    # We should probably use a hash of project_path as project_id or "default".


# Dependency Injection Placeholder
async def get_analysis_service() -> AnalysisOrchestratorService:
    raise NotImplementedError


async def get_notifier() -> WebSocketNotifier:
    raise NotImplementedError


@router.post("/api/run-analysis")
async def run_analysis(
    request: RunAnalysisRequest,
    service: AnalysisOrchestratorService = Depends(get_analysis_service),
):
    # Use a fixed project_id to match the single WebSocket connection used by frontend
    project_id = "default_session"

    return await service.start_analysis(
        project_id=project_id,
        project_path=request.project_path,
        mode=request.mode,
        selected_tools=request.selected_tools,
    )


@router.post("/api/stop-analysis")
async def stop_analysis(
    request: RunAnalysisRequest,
    service: AnalysisOrchestratorService = Depends(get_analysis_service),
):
    project_id = "default_session"
    return await service.stop_analysis(project_id)


@router.post("/api/stop-watch")
async def stop_watch(
    service: AnalysisOrchestratorService = Depends(get_analysis_service),
):
    project_id = "default_session"
    return await service.stop_analysis(project_id)


@router.websocket("/api/ws/analysis")
async def websocket_endpoint(
    websocket: WebSocket,
    notifier: WebSocketNotifier = Depends(get_notifier),
    service: AnalysisOrchestratorService = Depends(get_analysis_service),
):
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
