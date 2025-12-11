from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.modules.analysis.application.services import AnalysisOrchestratorService
from app.modules.analysis.infrastructure.adapters.websocket_notifier import (
    WebSocketNotifier,
)


@pytest.fixture
def mock_websocket_notifier() -> MagicMock:
    return AsyncMock(spec=WebSocketNotifier)


@pytest.mark.asyncio
async def test_start_analysis_watch_mode(mock_websocket_notifier: MagicMock):
    # Arrange
    service = AnalysisOrchestratorService(notifier=mock_websocket_notifier)
    project_id = "test_project"
    project_path = "/tmp/test"
    mode = "watch"

    # Mock WatchManager
    with patch("app.modules.analysis.application.services.WatchManager") as MockWatchManager:
        mock_watcher = AsyncMock()
        MockWatchManager.return_value = mock_watcher

        # Act
        result = await service.start_analysis(project_id=project_id, project_path=project_path, mode=mode)

        # Assert
        assert result["status"] == "accepted"
        assert result["mode"] == "watch"
        assert project_id in service.active_watchers

        # Verify WatchManager was initialized correctly
        MockWatchManager.assert_called_once()

        # Verify start_watching was called (scheduled)
        mock_watcher.start_watching.assert_called_once()


@pytest.mark.asyncio
async def test_start_analysis_full_mode(mock_websocket_notifier: MagicMock):
    # Arrange
    service = AnalysisOrchestratorService(notifier=mock_websocket_notifier)
    project_id = "test_project"
    project_path = "/tmp/test"
    mode = "full"

    # Mock AnalysisOrchestrator
    with patch("app.modules.analysis.application.services.AnalysisOrchestrator") as MockOrchestrator:
        mock_orchestrator_instance = AsyncMock()
        MockOrchestrator.return_value = mock_orchestrator_instance
        mock_orchestrator_instance.execute.return_value = {"status": "completed"}

        # Act
        await service.start_analysis(project_id=project_id, project_path=project_path, mode=mode)

        import asyncio

        await asyncio.sleep(0.1)

        # Assert
        # Verify Orchestrator was initialized and run
        MockOrchestrator.assert_called_once()
        mock_orchestrator_instance.execute.assert_called_once()


@pytest.mark.asyncio
async def test_start_analysis_full_mode_execution(mock_websocket_notifier: MagicMock):
    service = AnalysisOrchestratorService(notifier=mock_websocket_notifier)

    # Mock AnalysisOrchestrator
    with patch("app.modules.analysis.application.services.AnalysisOrchestrator") as MockOrchestrator:
        mock_orchestrator_instance = AsyncMock()
        MockOrchestrator.return_value = mock_orchestrator_instance
        mock_orchestrator_instance.execute.return_value = {"status": "completed"}

        await service.start_analysis(project_id="test_project", project_path="/tmp/test", mode="full")

        import asyncio

        await asyncio.sleep(0.1)

        # Verify Orchestrator was initialized and run
        MockOrchestrator.assert_called_once()
        mock_orchestrator_instance.execute.assert_called_once()
