from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI, WebSocket
from fastapi.testclient import TestClient

from app.modules.analysis.application.services import AnalysisOrchestratorService
from app.modules.analysis.infrastructure.web.router import (
    get_analysis_service,
    get_notifier,
    router,
)

# Setup FastAPI app for testing
app = FastAPI()
app.include_router(router)


@pytest.fixture
def mock_service() -> MagicMock:
    service = AsyncMock(spec=AnalysisOrchestratorService)
    service.start_analysis.return_value = {"status": "accepted", "mode": "full"}
    service.stop_analysis.return_value = {"status": "stopped"}
    return service


@pytest.fixture
def mock_notifier() -> MagicMock:
    notifier = AsyncMock()

    # Important: The router calls await notifier.connect(websocket, ...)
    # We need to simulate the side effect of accepting the websocket connection
    # because the real implementation does it.
    async def side_effect_connect(websocket: WebSocket, project_id: str):
        await websocket.accept()

    notifier.connect.side_effect = side_effect_connect

    # disconnect is synchronous in the real implementation
    notifier.disconnect = MagicMock()

    return notifier


@pytest.fixture
def client(mock_service: MagicMock, mock_notifier: MagicMock) -> TestClient:
    app.dependency_overrides[get_analysis_service] = lambda: mock_service
    app.dependency_overrides[get_notifier] = lambda: mock_notifier
    return TestClient(app)


def test_run_analysis(client: TestClient, mock_service: MagicMock, tmp_path):
    payload = {
        "project_path": str(tmp_path),
        "mode": "full",
        "selected_tools": ["tool1"],
        "project_id": "test-project-id",
    }
    response = client.post("/api/run-analysis", json=payload)

    assert response.status_code == 202
    assert response.json() == {"status": "accepted", "mode": "full"}

    mock_service.start_analysis.assert_called_once_with(
        project_id="test-project-id",
        project_path=str(tmp_path),
        mode="full",
        selected_tools=["tool1"],
    )


def test_stop_analysis(client: TestClient, mock_service: MagicMock):
    payload = {"project_path": "/tmp/test", "project_id": "test-project-id"}
    response = client.post("/api/stop-analysis", json=payload)

    assert response.status_code == 202
    assert response.json() == {"status": "stopped"}

    mock_service.stop_analysis.assert_called_once_with("test-project-id")


def test_websocket_endpoint(client: TestClient, mock_notifier: MagicMock, mock_service: MagicMock):
    with client.websocket_connect("/api/ws/analysis") as websocket:
        # Verify connection
        mock_notifier.connect.assert_called()

        # Send start command
        websocket.send_json({"command": "start", "path": "/tmp/test"})

        # We can't easily await the background task created by asyncio.create_task inside the endpoint
        # But we can verify the service was called if we wait a bit or if we mock create_task
        # However, TestClient runs in the same thread/loop usually?
        # Starlette TestClient uses a separate thread for the app.

        # Let's just verify connection and disconnection for now

    mock_notifier.disconnect.assert_called()
