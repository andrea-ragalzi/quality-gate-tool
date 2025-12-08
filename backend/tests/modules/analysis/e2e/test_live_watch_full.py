import asyncio
import logging
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from app.modules.analysis.application.engine.base_module import AnalysisModule
from app.modules.analysis.application.services import AnalysisOrchestratorService
from app.modules.analysis.infrastructure.adapters.websocket_notifier import (
    WebSocketNotifier,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MockAnalysisModule(AnalysisModule):
    def get_command(self, files: list[str] | None = None) -> list[str]:
        return ["echo", "mock_analysis"]

    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        return "Mock Summary"


@pytest.mark.asyncio
async def test_live_watch_full_flow(tmp_path: Path):
    """
    E2E-like test for the full Live Watch flow:
    Service -> WatchManager -> Watchdog -> Orchestrator -> Notifier
    """
    # 1. Setup Project
    project_dir = tmp_path / "e2e_project"
    project_dir.mkdir()
    main_file = project_dir / "main.py"
    main_file.write_text("print('initial')")

    # 2. Setup Mocks
    notifier = WebSocketNotifier()
    notifier.send_update = AsyncMock()

    # Patch the module classes to use our MockModule
    # We need to patch where MODULE_CLASSES is imported or defined
    with patch.dict(
        "app.modules.analysis.application.engine.orchestrator.MODULE_CLASSES",
        {"B_Ruff": MockAnalysisModule},
    ):
        service = AnalysisOrchestratorService(notifier)
        project_id = "test_session"

        # 3. Start Watch Mode
        logger.info("Starting Watch Mode...")
        result = await service.start_analysis(
            project_id=project_id,
            project_path=str(project_dir),
            mode="watch",
            selected_tools=["B_Ruff"],
        )
        assert result["status"] == "started"

        # Allow time for startup and initial analysis
        await asyncio.sleep(1)

        # Verify Initial Analysis
        # We expect at least one GLOBAL_INIT and GLOBAL_END
        init_calls = [
            c for c in notifier.send_update.call_args_list if c.args[1].get("type") == "GLOBAL_INIT"
        ]
        end_calls = [
            c for c in notifier.send_update.call_args_list if c.args[1].get("type") == "GLOBAL_END"
        ]

        assert len(init_calls) >= 1, "Initial analysis did not start"
        assert len(end_calls) >= 1, "Initial analysis did not finish"

        logger.info("Initial analysis verified.")
        notifier.send_update.reset_mock()

        # 4. Modify File
        logger.info("Modifying file...")
        # Ensure mtime changes significantly for filesystem
        await asyncio.sleep(0.5)
        main_file.write_text("print('modified')")

        # 5. Wait for Detection & Analysis
        # Watchdog debounce is 0.1s, plus execution time
        await asyncio.sleep(2)

        # 6. Verify Incremental Analysis
        # We expect:
        # - LOG (File changed)
        # - GLOBAL_INIT
        # - LOG (Incremental mode...)
        # - INIT (Module)
        # - END (Module)
        # - GLOBAL_END

        calls = notifier.send_update.call_args_list
        messages = [c.args[1] for c in calls]

        logger.info(f"Captured messages: {messages}")

        # Check for Analysis Start
        incremental_init = [m for m in messages if m.get("type") == "GLOBAL_INIT"]
        assert (
            len(incremental_init) >= 1
        ), "Incremental analysis did not start after file modification"

        # Check for Module Execution
        module_init = [
            m for m in messages if m.get("type") == "INIT" and m.get("module") == "B_Ruff"
        ]
        assert len(module_init) >= 1, "Mock module did not start"

        # Check for Completion
        global_end = [m for m in messages if m.get("type") == "GLOBAL_END"]
        assert len(global_end) >= 1, "Incremental analysis did not finish"

        # 7. Stop Watch
        await service.stop_analysis(project_id)
