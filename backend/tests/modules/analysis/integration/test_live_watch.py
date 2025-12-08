import asyncio
import logging
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest

from app.modules.analysis.infrastructure.adapters.file_watcher import WatchManager

# Configure logging to see what's happening
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@pytest.mark.asyncio
async def test_live_watch_real_filesystem(tmp_path: Path):
    """
    Integration test verifying that:
    1. WatchManager starts correctly on a real filesystem.
    2. Modifying a real file triggers the observer.
    3. The observer triggers the callback.
    4. The callback triggers the Orchestrator.
    """
    # 1. Setup Project Structure
    project_dir = tmp_path / "test_project"
    project_dir.mkdir()

    (project_dir / "main.py").write_text("print('hello')")

    # 2. Setup Dependencies
    mock_notifier = AsyncMock()

    # Patch CodeChangeHandler to reduce debounce delay for testing
    from watchdog.observers import Observer

    from app.modules.analysis.infrastructure.adapters.file_watcher import (
        CodeChangeHandler,
    )

    original_init = CodeChangeHandler.__init__

    def fast_init(self: Any, *args: Any, **kwargs: Any):
        original_init(self, *args, **kwargs)
        self.debounce_delay = 0.1  # Speed up test

    # We patch Orchestrator because we don't want to run actual tools (ESLint, Pyright)
    # in this test, we just want to know they WOULD be triggered.
    # We also patch PollingObserver to use the native Observer (inotify) which is faster/more reliable for local tests
    with (
        patch("app.modules.analysis.infrastructure.adapters.file_watcher.AnalysisOrchestrator") as MockOrchestrator,
        patch.object(CodeChangeHandler, "__init__", fast_init),
        patch(
            "app.modules.analysis.infrastructure.adapters.file_watcher.PollingObserver",
            Observer,
        ),
    ):
        mock_orchestrator_instance = MockOrchestrator.return_value
        mock_orchestrator_instance.execute = AsyncMock(return_value={"status": "success"})

        manager = WatchManager(str(project_dir), mock_notifier)

        # 3. Start Watching
        # We run start_watching in a task because it blocks
        watch_task = asyncio.create_task(manager.start_watching())

        try:
            # Allow startup time and initial analysis
            await asyncio.sleep(1)

            # Verify initial analysis ran
            assert MockOrchestrator.call_count >= 1, "Initial analysis did not run"
            assert MockOrchestrator.call_args_list[0].kwargs["mode"] == "full"

            initial_call_count = MockOrchestrator.call_count

            # 4. Modify a file
            logger.info("Modifying file...")
            # Ensure mtime changes
            await asyncio.sleep(1)
            (project_dir / "main.py").write_text("print('modified')")

            # 5. Wait for detection (Observer + Debounce)
            # Debounce is 0.1s. We wait up to 5s.
            max_retries = 10
            found = False
            for _ in range(max_retries):
                await asyncio.sleep(0.5)
                if MockOrchestrator.call_count > initial_call_count:
                    found = True
                    break

            if not found:
                pytest.fail("File modification was not detected by WatchManager within timeout")

            # 6. Verify Incremental Analysis
            # Get the last call
            last_call = MockOrchestrator.call_args_list[-1]
            assert last_call.kwargs["mode"] == "incremental"
            assert last_call.kwargs["project_path"] == str(project_dir)

            # Verify WebSocket message
            # Check if any call to broadcast_raw contained the log message
            log_calls = [c[0][0] for c in mock_notifier.broadcast_raw.call_args_list]
            assert any("Auto-triggering analysis" in str(msg) for msg in log_calls)

        finally:
            # Cleanup
            manager.stop_event.set()
            await watch_task
