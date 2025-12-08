from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.modules.analysis.application.engine.orchestrator import AnalysisOrchestrator
from app.modules.analysis.domain.ports import AnalysisNotifierPort


@pytest.fixture
def mock_notifier() -> MagicMock:
    return AsyncMock(spec=AnalysisNotifierPort)


@pytest.mark.asyncio
async def test_get_modified_files_incremental_success(mock_notifier: MagicMock):
    # Arrange
    orchestrator = AnalysisOrchestrator(
        project_path="/tmp/test", mode="incremental", ws_manager=mock_notifier
    )

    # Mock subprocess
    mock_process = AsyncMock()
    mock_process.communicate.return_value = (b"file1.py\nfile2.ts\n", b"")
    mock_process.returncode = 0

    with patch("asyncio.create_subprocess_exec", return_value=mock_process) as mock_exec:
        # Act
        files = await orchestrator.get_modified_files()

        # Assert
        assert files == ["file1.py", "file2.ts"]
        mock_exec.assert_called_once()


@pytest.mark.asyncio
async def test_get_modified_files_not_incremental(mock_notifier: MagicMock):
    # Arrange
    orchestrator = AnalysisOrchestrator(
        project_path="/tmp/test", mode="full", ws_manager=mock_notifier
    )

    # Act
    files = await orchestrator.get_modified_files()

    # Assert
    assert files == []


@pytest.mark.asyncio
async def test_get_modified_files_git_failure(mock_notifier: MagicMock):
    # Arrange
    orchestrator = AnalysisOrchestrator(
        project_path="/tmp/test", mode="incremental", ws_manager=mock_notifier
    )

    # Mock subprocess failure
    mock_process = AsyncMock()
    mock_process.communicate.return_value = (b"", b"error")
    mock_process.returncode = 1

    with patch("asyncio.create_subprocess_exec", return_value=mock_process):
        # Act
        files = await orchestrator.get_modified_files()

        # Assert
        assert files == []


@pytest.mark.asyncio
async def test_get_modified_files_exception(mock_notifier: MagicMock):
    # Arrange
    orchestrator = AnalysisOrchestrator(
        project_path="/tmp/test", mode="incremental", ws_manager=mock_notifier
    )

    with patch("asyncio.create_subprocess_exec", side_effect=Exception("Boom")):
        # Act
        files = await orchestrator.get_modified_files()

        # Assert
        assert files == []


@pytest.mark.asyncio
async def test_execute_full_success(mock_notifier: MagicMock):
    # Arrange
    orchestrator = AnalysisOrchestrator(
        project_path="/tmp/test", mode="full", ws_manager=mock_notifier
    )

    # Mock run_parallel_modules
    orchestrator.run_parallel_modules = AsyncMock(return_value={"mod1": "PASS", "mod2": "PASS"})

    # Act
    result = await orchestrator.execute()

    # Assert
    assert result["status"] == "PASS"
    assert result["mode"] == "full"
    mock_notifier.send_global_init.assert_called_once()
    mock_notifier.send_global_end.assert_called_once_with("SUCCESS")


@pytest.mark.asyncio
async def test_execute_incremental_with_files(mock_notifier: MagicMock):
    # Arrange
    orchestrator = AnalysisOrchestrator(
        project_path="/tmp/test", mode="incremental", ws_manager=mock_notifier
    )

    # Mock get_modified_files
    orchestrator.get_modified_files = AsyncMock(return_value=["file1.py"])

    # Mock run_parallel_modules
    orchestrator.run_parallel_modules = AsyncMock(return_value={"mod1": "PASS"})

    # Act
    result = await orchestrator.execute()

    # Assert
    assert result["status"] == "PASS"
    assert result["modified_files_count"] == 1
    orchestrator.run_parallel_modules.assert_called_once_with(["file1.py"])


@pytest.mark.asyncio
async def test_execute_failure(mock_notifier: MagicMock):
    # Arrange
    orchestrator = AnalysisOrchestrator(
        project_path="/tmp/test", mode="full", ws_manager=mock_notifier
    )

    # Mock run_parallel_modules to raise exception
    orchestrator.run_parallel_modules = AsyncMock(side_effect=Exception("Crash"))

    # Act
    result = await orchestrator.execute()

    # Assert
    assert result["status"] == "FAIL"
    assert "error" in result
    mock_notifier.broadcast_raw.assert_called()


@pytest.mark.asyncio
async def test_calculate_final_status(mock_notifier: MagicMock):
    orchestrator = AnalysisOrchestrator(
        project_path="/tmp/test", mode="full", ws_manager=mock_notifier
    )

    assert orchestrator.calculate_final_status({"m1": "PASS", "m2": "PASS"}) == "PASS"
    assert orchestrator.calculate_final_status({"m1": "PASS", "m2": "FAIL"}) == "FAIL"
    assert orchestrator.calculate_final_status({}) == "PASS"


@pytest.mark.asyncio
async def test_run_parallel_modules(mock_notifier: MagicMock):
    # Arrange
    orchestrator = AnalysisOrchestrator(
        project_path="/tmp/test",
        mode="full",
        ws_manager=mock_notifier,
        selected_tools=["F_TypeScript"],
    )

    # Mock module instantiation
    mock_module_instance = AsyncMock()
    mock_module_instance.run.return_value = "PASS"
    mock_module_instance.module_id = "F_TypeScript"

    with patch.dict(
        "app.modules.analysis.application.engine.orchestrator.MODULE_CLASSES",
        {"F_TypeScript": MagicMock(return_value=mock_module_instance)},
    ):
        # Act
        results = await orchestrator.run_parallel_modules()

        # Assert
        assert results == {"F_TypeScript": "PASS"}
        mock_module_instance.run.assert_called_once()


@pytest.mark.asyncio
async def test_run_parallel_modules_exception(mock_notifier: MagicMock):
    # Arrange
    orchestrator = AnalysisOrchestrator(
        project_path="/tmp/test",
        mode="full",
        ws_manager=mock_notifier,
        selected_tools=["F_TypeScript"],
    )

    # Mock module instantiation
    mock_module_instance = AsyncMock()
    mock_module_instance.run.side_effect = Exception("Module Crash")
    mock_module_instance.module_id = "F_TypeScript"

    with patch.dict(
        "app.modules.analysis.application.engine.orchestrator.MODULE_CLASSES",
        {"F_TypeScript": MagicMock(return_value=mock_module_instance)},
    ):
        # Act
        results = await orchestrator.run_parallel_modules()

        # Assert
        assert results == {"F_TypeScript": "FAIL"}
