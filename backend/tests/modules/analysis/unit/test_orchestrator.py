from unittest.mock import AsyncMock, MagicMock

import pytest

from app.modules.analysis.application.engine.orchestrator import AnalysisOrchestrator
from app.modules.analysis.domain.ports import AnalysisNotifierPort


@pytest.fixture
def mock_notifier() -> MagicMock:
    return AsyncMock(spec=AnalysisNotifierPort)


@pytest.mark.asyncio
async def test_orchestrator_initialization(mock_notifier: MagicMock):
    # Arrange
    project_path = "/tmp/test"
    mode = "full"

    # Act
    orchestrator = AnalysisOrchestrator(project_path=project_path, mode=mode, ws_manager=mock_notifier)

    # Assert
    assert orchestrator.mode == "full"
    assert orchestrator.ws_manager == mock_notifier
    assert orchestrator.results == {}


@pytest.mark.asyncio
async def test_orchestrator_incremental_mode(mock_notifier: MagicMock):
    # Arrange
    project_path = "/tmp/test"
    mode = "incremental"

    # Act
    orchestrator = AnalysisOrchestrator(project_path=project_path, mode=mode, ws_manager=mock_notifier)

    # Assert
    assert orchestrator.mode == "incremental"
