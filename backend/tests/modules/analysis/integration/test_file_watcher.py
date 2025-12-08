import asyncio
import logging
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

# pyright: reportPrivateUsage=none
import pytest
from watchdog.observers.polling import PollingObserver

from app.modules.analysis.infrastructure.adapters.file_watcher import (
    CodeChangeHandler,
    WatchManager,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
DEBOUNCE_DELAY = 0.5


@pytest.fixture
def mock_callback():
    return MagicMock()


@pytest.fixture
async def watcher_adapter(tmp_path: Path, mock_callback: MagicMock):
    """
    Fixture that creates and starts a WatchManager (FileWatcherAdapter)
    with a mocked callback and isolated filesystem.
    """
    # Mock the WebSocket manager since WatchManager needs it
    mock_ws_manager = MagicMock()
    mock_ws_manager.broadcast_raw = MagicMock()

    # Create the manager
    manager = WatchManager(str(tmp_path), mock_ws_manager)

    # Patch the debounce delay to match test requirements
    # We need to patch CodeChangeHandler's init or the instance after creation
    # Since WatchManager creates CodeChangeHandler inside start_watching,
    # we'll patch the class __init__ temporarily or patch the attribute after start (if accessible)
    # Easier: Patch CodeChangeHandler in the module

    # Better approach: Subclass or modify the manager to expose the handler,
    # or just patch the constant/attribute if possible.
    # Given the code structure, we can patch CodeChangeHandler.__init__ to set the delay.

    original_init = CodeChangeHandler.__init__

    def patched_init(self: Any, *args: Any, **kwargs: Any):
        original_init(self, *args, **kwargs)
        self.debounce_delay = DEBOUNCE_DELAY

    with patch.object(CodeChangeHandler, "__init__", side_effect=patched_init, autospec=True):
        # We also need to mock the _run_analysis method of the manager
        # because that's what gets called by the handler.
        # The handler calls self.callback(files).
        # In WatchManager, callback is self._run_analysis.
        # We want to verify that _run_analysis is called, OR that the mock_callback passed to the fixture is called.
        # Since WatchManager hardcodes the callback to self._run_analysis, we should patch _run_analysis.

        manager._run_analysis = MagicMock(wraps=manager._run_analysis)
        # But _run_analysis is async...
        # Let's replace it with an AsyncMock that calls our synchronous mock_callback for verification

        async def async_callback_wrapper(files: list[str]):
            mock_callback(files)

        manager._run_analysis = async_callback_wrapper

        # Use PollingObserver for reliability in tests (like in the real code)
        # The real code uses PollingObserver.

        # Start watching
        start_task = asyncio.create_task(manager.start_watching())
        await asyncio.sleep(0.1)  # Give it a moment to start

        yield manager

        # Cleanup
        await manager.stop_watching()
        await start_task


@pytest.mark.asyncio
async def test_single_file_modification_triggers_callback(tmp_path: Path, mock_callback: MagicMock):
    """
    Test 1: Single Modification Test
    Assert that after creating and modifying a file in the monitored path,
    the mock callback is called exactly once after waiting longer than the debounce delay.
    """
    # Setup
    # We need to manually setup the manager here if we want to control the lifecycle precisely
    # or use the fixture. The fixture is cleaner.

    # Re-implementing fixture logic inline to match the "Generate a single Python file" request
    # and ensure self-contained readability as requested by the prompt style.

    mock_ws = MagicMock()
    mock_ws.broadcast_raw = AsyncMock()
    mock_ws.send_global_init = AsyncMock()
    mock_ws.send_global_end = AsyncMock()
    manager = WatchManager(str(tmp_path), mock_ws)

    # Mock the internal callback
    manager._run_analysis = AsyncMock()

    # Patch delay
    original_init = CodeChangeHandler.__init__

    def patched_init(self: Any, *args: Any, **kwargs: Any):
        original_init(self, *args, **kwargs)
        self.debounce_delay = DEBOUNCE_DELAY

    with patch.object(
        CodeChangeHandler,
        "__init__",
        side_effect=patched_init,
        autospec=True,
    ):
        # Start
        start_task = asyncio.create_task(manager.start_watching())
        await asyncio.sleep(0.5)  # Startup buffer

        # Create file
        test_file = tmp_path / "test.py"
        test_file.write_text("print('hello')")

        # Wait > Debounce (0.5s) + Polling Interval
        await asyncio.sleep(2.0)

        # Assert
        manager._run_analysis.assert_called()
        assert manager._run_analysis.call_count == 1

        # Cleanup
        await manager.stop_watching()
        await start_task


@pytest.mark.asyncio
async def test_rapid_modifications_only_trigger_once(tmp_path: Path):
    """
    Test 2: Debounce Logic Test
    Modify the same file 3 times, with a short delay between each write.
    Assert that the mock callback is called exactly once after the final wait period.
    """
    mock_ws = MagicMock()
    mock_ws.broadcast_raw = AsyncMock()
    mock_ws.send_global_init = AsyncMock()
    mock_ws.send_global_end = AsyncMock()
    manager = WatchManager(str(tmp_path), mock_ws)

    # Mock the internal callback
    # We need a real async function for the callback to be awaited properly
    call_count = 0

    async def mock_analysis(files: list[str]):
        nonlocal call_count
        call_count += 1

    manager._run_analysis = mock_analysis

    # Patch delay
    original_init = CodeChangeHandler.__init__

    def patched_init(self: Any, *args: Any, **kwargs: Any):
        original_init(self, *args, **kwargs)
        self.debounce_delay = DEBOUNCE_DELAY

    with patch.object(
        CodeChangeHandler,
        "__init__",
        side_effect=patched_init,
        autospec=True,
    ):
        # Start
        start_task = asyncio.create_task(manager.start_watching())
        await asyncio.sleep(0.5)

        test_file = tmp_path / "rapid.py"
        test_file.touch()

        # Rapid modifications
        for i in range(3):
            test_file.write_text(f"print({i})")
            await asyncio.sleep(0.1)  # Short delay < Debounce (0.5)

        # Wait > Debounce
        await asyncio.sleep(2.0)

        # Assert
        # Note: The initial touch() might trigger one analysis if it happened > 0.5s before the loop.
        # But here we touch and immediately loop.
        # The first write happens 0.1s after touch.
        # The debounce timer resets on each write.
        # So we expect exactly 1 call after the LAST write.

        assert call_count == 1

        # Cleanup
        await manager.stop_watching()
        await start_task


@pytest.mark.asyncio
async def test_project_switch_updates_monitoring(tmp_path: Path):
    """
    Test 3: Project Switch Lifecycle Test
    Verifies that stopping a watcher on Project A stops events,
    and starting a new watcher on Project B works correctly.
    """
    # Setup paths
    project_a = tmp_path / "project_a"
    project_a.mkdir()
    project_b = tmp_path / "project_b"
    project_b.mkdir()

    # Common Mocks
    mock_ws = MagicMock()
    mock_ws.broadcast_raw = AsyncMock()
    mock_ws.send_global_init = AsyncMock()
    mock_ws.send_global_end = AsyncMock()

    # Patch PollingObserver to be faster (0.1s timeout)
    # This ensures that 0.7s wait (0.5 debounce + 0.2 buffer) is enough
    with patch(
        "app.modules.analysis.infrastructure.adapters.file_watcher.PollingObserver"
    ) as MockObserver:
        MockObserver.side_effect = lambda: PollingObserver(timeout=0.1)

        # Patch delay
        original_init = CodeChangeHandler.__init__

        def patched_init(self: Any, *args: Any, **kwargs: Any):
            original_init(self, *args, **kwargs)
            self.debounce_delay = DEBOUNCE_DELAY

        with patch.object(CodeChangeHandler, "__init__", side_effect=patched_init, autospec=True):
            # --- Phase 1: Monitor Project A ---
            manager_a = WatchManager(str(project_a), mock_ws)

            # Mock callback for A
            call_count_a = 0

            async def mock_analysis_a(files: list[str]):
                nonlocal call_count_a
                call_count_a += 1

            manager_a._run_analysis = mock_analysis_a

            # Start A
            task_a = asyncio.create_task(manager_a.start_watching())
            await asyncio.sleep(0.5)  # Startup

            # Modify A
            file_a = project_a / "file_a.py"
            file_a.write_text("print('A')")

            # Wait
            await asyncio.sleep(DEBOUNCE_DELAY + 0.2)

            # Assert A called
            assert call_count_a == 1

            # --- Phase 2: Stop and Switch ---
            await manager_a.stop_watching()
            await task_a

            # Modify A again
            file_a.write_text("print('A changed')")

            # Wait
            await asyncio.sleep(DEBOUNCE_DELAY + 0.2)

            # Assert A NOT called again
            assert call_count_a == 1

            # --- Phase 3: Monitor Project B ---
            manager_b = WatchManager(str(project_b), mock_ws)

            # Mock callback for B
            call_count_b = 0

            async def mock_analysis_b(files: list[str]):
                nonlocal call_count_b
                call_count_b += 1

            manager_b._run_analysis = mock_analysis_b

            # Start B
            task_b = asyncio.create_task(manager_b.start_watching())
            await asyncio.sleep(0.5)  # Startup

            # Modify B
            file_b = project_b / "file_b.py"
            file_b.write_text("print('B')")

            # Wait
            await asyncio.sleep(DEBOUNCE_DELAY + 0.2)

            # Assert B called
            assert call_count_b == 1

            # Cleanup B
            await manager_b.stop_watching()
            await task_b
