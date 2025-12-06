import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.modules.analysis.infrastructure.adapters.file_watcher import (
    CodeChangeHandler,
    WatchManager,
)

# --- CodeChangeHandler Tests ---


def test_is_relevant_file():
    # Arrange
    loop = MagicMock()
    handler = CodeChangeHandler("/project/test", AsyncMock(), loop)

    # Act & Assert
    assert handler._is_relevant_file("/project/test/main.py") is True
    assert handler._is_relevant_file("/project/test/app.js") is True
    assert handler._is_relevant_file("/project/test/config.json") is True

    assert handler._is_relevant_file("/project/test/image.png") is False
    assert handler._is_relevant_file("/project/test/.venv/lib/site-packages/pkg.py") is False
    assert handler._is_relevant_file("/project/test/__pycache__/module.cpython-311.pyc") is False
    assert handler._is_relevant_file("/project/test/.git/HEAD") is False


def test_on_modified_ignores_directory():
    # Arrange
    loop = MagicMock()
    handler = CodeChangeHandler("/tmp/test", AsyncMock(), loop)
    event = MagicMock()
    event.is_directory = True

    # Act
    with patch.object(handler, "_handle_change") as mock_handle:
        handler.on_modified(event)

    # Assert
    mock_handle.assert_not_called()


def test_on_modified_calls_handle_change():
    # Arrange
    loop = MagicMock()
    handler = CodeChangeHandler("/tmp/test", AsyncMock(), loop)
    event = MagicMock()
    event.is_directory = False
    event.src_path = "/tmp/test/main.py"

    # Act
    with patch.object(handler, "_handle_change") as mock_handle:
        handler.on_modified(event)

    # Assert
    mock_handle.assert_called_once_with("/tmp/test/main.py")


# --- WatchManager Tests ---


@pytest.mark.asyncio
async def test_watch_manager_start_watching():
    # Arrange
    ws_manager = AsyncMock()
    manager = WatchManager("/tmp/test", ws_manager)

    # Mock PollingObserver
    with (
        patch(
            "app.modules.analysis.infrastructure.adapters.file_watcher.PollingObserver"
        ) as MockObserver,
        patch(
            "app.modules.analysis.infrastructure.adapters.file_watcher.AnalysisOrchestrator"
        ) as MockOrchestrator,
    ):
        mock_observer = MagicMock()
        MockObserver.return_value = mock_observer

        mock_orchestrator = AsyncMock()
        MockOrchestrator.return_value = mock_orchestrator
        mock_orchestrator.execute.return_value = {}

        # Act
        # Run start_watching in a background task because it blocks waiting for stop_event
        task = asyncio.create_task(manager.start_watching())

        # Give it a moment to initialize and reach the wait state
        await asyncio.sleep(0.1)

        # Signal to stop
        manager.stop_event.set()

        # Wait for the task to complete
        await task

        # Assert
        ws_manager.broadcast_raw.assert_called()
        MockObserver.assert_called_once()
        mock_observer.start.assert_called_once()
        MockOrchestrator.assert_called_once()
        mock_orchestrator.execute.assert_called_once()


@pytest.mark.asyncio
async def test_watch_manager_stop():
    # Arrange
    ws_manager = AsyncMock()
    manager = WatchManager("/tmp/test", ws_manager)
    mock_observer = MagicMock()
    manager.observer = mock_observer
    manager.is_running = True  # Must be running to stop

    # Act
    await manager.stop()

    # Assert
    assert manager.stop_event.is_set()
    mock_observer.stop.assert_called_once()
    mock_observer.join.assert_called_once()


@pytest.mark.asyncio
async def test_debounced_analysis_trigger():
    # Arrange
    loop = MagicMock()
    callback = AsyncMock()
    handler = CodeChangeHandler("/tmp/test", callback, loop)
    handler.modified_files.add("file1.py")
    handler.debounce_delay = 0.01  # Short delay for test

    # Act
    await handler._debounced_analysis()

    # Assert
    callback.assert_called_once_with(["file1.py"])
    assert len(handler.modified_files) == 0
    assert handler.is_analyzing is False


@pytest.mark.asyncio
async def test_debounced_analysis_skip_if_analyzing():
    # Arrange
    loop = MagicMock()
    callback = AsyncMock()
    handler = CodeChangeHandler("/tmp/test", callback, loop)
    handler.modified_files.add("file1.py")
    handler.is_analyzing = True
    handler.debounce_delay = 0.01

    # Act
    await handler._debounced_analysis()

    # Assert
    callback.assert_not_called()
    assert "file1.py" in handler.modified_files  # Should remain pending


@pytest.mark.asyncio
async def test_run_analysis_callback():
    # Arrange
    ws_manager = AsyncMock()
    manager = WatchManager("/tmp/test", ws_manager)

    with patch(
        "app.modules.analysis.infrastructure.adapters.file_watcher.AnalysisOrchestrator"
    ) as MockOrchestrator:
        mock_orchestrator = AsyncMock()
        MockOrchestrator.return_value = mock_orchestrator
        mock_orchestrator.execute.return_value = {"status": "PASS"}

        # Act
        await manager._run_analysis(["file1.py"])

        # Assert
        MockOrchestrator.assert_called_once()
        mock_orchestrator.execute.assert_called_once()
        ws_manager.broadcast_raw.assert_called()


@pytest.mark.asyncio
async def test_run_analysis_exception():
    # Arrange
    ws_manager = AsyncMock()
    manager = WatchManager("/tmp/test", ws_manager)

    with patch(
        "app.modules.analysis.infrastructure.adapters.file_watcher.AnalysisOrchestrator"
    ) as MockOrchestrator:
        mock_orchestrator = AsyncMock()
        MockOrchestrator.return_value = mock_orchestrator
        mock_orchestrator.execute.side_effect = Exception("Analysis Crash")

        # Act
        await manager._run_analysis(["file1.py"])

        # Assert
        ws_manager.broadcast_raw.assert_called()
        # Verify error message was broadcasted
        # We can check the last call or search in calls
        error_calls = [
            call for call in ws_manager.broadcast_raw.call_args_list if "ERROR" in str(call)
        ]
        assert len(error_calls) > 0


def test_on_created_calls_handle_change():
    # Arrange
    loop = MagicMock()
    handler = CodeChangeHandler("/tmp/test", AsyncMock(), loop)
    event = MagicMock()
    event.is_directory = False
    event.src_path = "/tmp/test/file.py"

    # Act
    with patch.object(handler, "_handle_change") as mock_handle:
        handler.on_created(event)

    # Assert
    mock_handle.assert_called_once_with("/tmp/test/file.py")


def test_on_created_ignores_directory():
    # Arrange
    loop = MagicMock()
    handler = CodeChangeHandler("/tmp/test", AsyncMock(), loop)
    event = MagicMock()
    event.is_directory = True
    event.src_path = "/tmp/test/dir"

    # Act
    with patch.object(handler, "_handle_change") as mock_handle:
        handler.on_created(event)

    # Assert
    mock_handle.assert_not_called()
