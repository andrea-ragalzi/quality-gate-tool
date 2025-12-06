from unittest.mock import AsyncMock

import pytest
from fastapi import WebSocket

from app.modules.analysis.infrastructure.adapters.websocket_notifier import (
    WebSocketNotifier,
)


@pytest.mark.asyncio
async def test_websocket_connect():
    # Arrange
    notifier = WebSocketNotifier()
    mock_ws = AsyncMock(spec=WebSocket)
    project_id = "p1"

    # Act
    await notifier.connect(mock_ws, project_id)

    # Assert
    mock_ws.accept.assert_called_once()
    assert mock_ws in notifier.active_connections[project_id]


@pytest.mark.asyncio
async def test_websocket_disconnect():
    # Arrange
    notifier = WebSocketNotifier()
    mock_ws = AsyncMock(spec=WebSocket)
    project_id = "p1"
    # Manually simulate connection
    notifier.active_connections[project_id] = [mock_ws]

    # Act
    notifier.disconnect(mock_ws, project_id)

    # Assert
    assert project_id not in notifier.active_connections


@pytest.mark.asyncio
async def test_websocket_send_update():
    # Arrange
    notifier = WebSocketNotifier()
    mock_ws1 = AsyncMock(spec=WebSocket)
    mock_ws2 = AsyncMock(spec=WebSocket)
    project_id = "p1"
    # Manually simulate connections
    notifier.active_connections[project_id] = [mock_ws1, mock_ws2]
    message = {"data": "test"}

    # Act
    await notifier.send_update(project_id, message)

    # Assert
    mock_ws1.send_json.assert_called_once_with(message)
    mock_ws2.send_json.assert_called_once_with(message)


@pytest.mark.asyncio
async def test_websocket_send_update_no_connections():
    # Arrange
    notifier = WebSocketNotifier()
    project_id = "p1"
    message = {"data": "test"}

    # Act
    # Should not raise error
    await notifier.send_update(project_id, message)

    # Assert
    # No assertions needed, just ensuring no crash
