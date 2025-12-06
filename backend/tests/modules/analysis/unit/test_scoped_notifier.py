from unittest.mock import AsyncMock

import pytest

from app.modules.analysis.infrastructure.adapters.scoped_notifier import (
    ScopedAnalysisNotifier,
)
from app.modules.analysis.infrastructure.adapters.websocket_notifier import (
    WebSocketNotifier,
)


@pytest.mark.asyncio
async def test_scoped_notifier_send_update():
    # Arrange
    mock_notifier = AsyncMock(spec=WebSocketNotifier)
    project_id = "test_project"
    scoped_notifier = ScopedAnalysisNotifier(mock_notifier, project_id)
    message = {"status": "running"}

    # Act
    await scoped_notifier.send_update("ignored_id", message)

    # Assert
    mock_notifier.send_update.assert_called_once_with(project_id, message)


@pytest.mark.asyncio
async def test_scoped_notifier_send_global_init():
    # Arrange
    mock_notifier = AsyncMock(spec=WebSocketNotifier)
    project_id = "test_project"
    scoped_notifier = ScopedAnalysisNotifier(mock_notifier, project_id)

    # Act
    await scoped_notifier.send_global_init()

    # Assert
    mock_notifier.send_update.assert_called_once_with(project_id, {"type": "GLOBAL_INIT"})


@pytest.mark.asyncio
async def test_scoped_notifier_broadcast_raw():
    # Arrange
    mock_notifier = AsyncMock(spec=WebSocketNotifier)
    project_id = "test_project"
    scoped_notifier = ScopedAnalysisNotifier(mock_notifier, project_id)
    message = {"raw": "data"}

    # Act
    await scoped_notifier.broadcast_raw(message)

    # Assert
    mock_notifier.send_update.assert_called_once_with(project_id, message)


@pytest.mark.asyncio
async def test_scoped_notifier_send_global_end():
    # Arrange
    mock_notifier = AsyncMock(spec=WebSocketNotifier)
    project_id = "test_project"
    scoped_notifier = ScopedAnalysisNotifier(mock_notifier, project_id)
    status = "completed"

    # Act
    await scoped_notifier.send_global_end(status)

    # Assert
    mock_notifier.send_update.assert_called_once_with(
        project_id, {"type": "GLOBAL_END", "status": status}
    )
