import asyncio
import time
from unittest.mock import AsyncMock, patch

import pytest

from app.modules.analysis.application.engine.base_module import AnalysisModule
from app.modules.analysis.domain.ports import AnalysisNotifierPort


class MockModule(AnalysisModule):
    def get_command(self, files: list[str] | None = None) -> list[str]:
        return ["echo", "test"]

    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        return "Summary"


@pytest.mark.asyncio
async def test_io_decoupling_architecture():
    """
    Verifies that the I/O reading from subprocess is decoupled from the WebSocket sending.

    Scenario:
    - Subprocess produces output fast.
    - WebSocket sending is slow (simulated latency).
    - Expectation: The subprocess output should be read completely and quickly,
      NOT blocked by the slow WebSocket sender.
    """
    # Arrange
    mock_notifier = AsyncMock(spec=AnalysisNotifierPort)

    # Simulate slow network - VERY slow to ensure failure if coupled
    async def slow_send(*args, **kwargs):
        await asyncio.sleep(0.3)

    mock_notifier.send_stream.side_effect = slow_send

    module = MockModule("test_decoupled", "Test Module", "/tmp", mock_notifier)

    # Mock subprocess
    mock_process = AsyncMock()

    # Simulate chunks that will trigger the buffer limit (32KB) multiple times
    # 30 chunks of 4KB = 120KB total.
    # Should trigger send at 32, 64, 96KB (3 times).
    # Total delay if coupled: 3 * 0.3 = 0.9s
    chunk_size = 4096
    chunks = [b"x" * chunk_size for _ in range(30)] + [b""]

    # Track when reads happen
    read_timestamps = []

    async def tracked_read(n):
        read_timestamps.append(time.time())
        if chunks:
            return chunks.pop(0)
        return b""

    mock_process.stdout.read.side_effect = tracked_read
    mock_process.stderr.read.return_value = b""
    mock_process.wait.return_value = 0
    mock_process.returncode = 0

    with patch("asyncio.create_subprocess_exec", return_value=mock_process):
        # Act
        await module.run()

    # Assert
    # 1. Calculate time difference between first and last read
    read_duration = read_timestamps[-1] - read_timestamps[0]

    # 2. Total expected send time is 10 chunks * 0.05s = 0.5s
    # If coupled, read_duration would be approx 0.5s (because each read waits for send)
    # If decoupled, read_duration should be very small (just the loop overhead)

    print(f"Read duration: {read_duration:.4f}s")

    # We expect reads to finish VERY fast, definitely under 0.1s
    # The current implementation (coupled) will fail this because it awaits send_stream inside the read loop
    # (Note: The current implementation buffers, but if we force small chunks or fill buffer, it blocks.
    # To ensure the test fails on the *current* implementation, we need to ensure the buffer logic
    # triggers a send. The current logic sends if buffer > 32KB OR time > 0.1s.
    # Our chunks are small, so it might hit the time limit.
    # Let's force the buffer logic to trigger or just rely on the fact that we want to prove decoupling.
    # Actually, the current implementation waits 0.1s before sending if buffer is small.
    # So it will read... wait 0.1s... send... read... wait 0.1s...
    # So reads will be spaced out.

    assert read_duration < 0.2, f"Reads took too long ({read_duration}s), indicating coupling with sender."
