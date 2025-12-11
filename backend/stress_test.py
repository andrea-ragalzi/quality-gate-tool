import asyncio
import logging
import sys
import time
from unittest.mock import AsyncMock

from app.modules.analysis.application.engine.base_module import AnalysisModule
from app.modules.analysis.domain.ports import AnalysisNotifierPort

# Configure logging to stdout
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)


class StressTestModule(AnalysisModule):
    def get_command(self, files: list[str] | None = None) -> list[str]:
        # This command simulates high volume output
        # It prints 1000 lines of 1KB each = ~1MB of data
        return ["python3", "-c", "import sys; [print('x' * 1024) for _ in range(1000)]"]

    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        return "Stress Test Complete"


async def run_stress_test() -> None:
    print("--- Starting Stress Test ---")

    mock_notifier = AsyncMock(spec=AnalysisNotifierPort)

    # Track send calls
    send_count = 0
    total_bytes_sent = 0

    async def track_send(module_id: str, chunk: str, encoding: str | None = None) -> None:
        nonlocal send_count, total_bytes_sent
        send_count += 1
        # If compressed, chunk is base64 string, so len is accurate for network size
        # If raw, chunk is string
        total_bytes_sent += len(chunk)
        # Simulate network delay
        await asyncio.sleep(0.001)

    mock_notifier.send_stream.side_effect = track_send

    module = StressTestModule("stress_test", "Stress Test", "/tmp", mock_notifier)

    start_time = time.time()
    await module.run()
    end_time = time.time()

    duration = end_time - start_time
    print("\n--- Stress Test Results ---")
    print(f"Duration: {duration:.4f}s")
    print(f"Total Sends: {send_count}")
    print(f"Total Bytes Sent (Network): {total_bytes_sent}")
    print(f"Average Send Size: {total_bytes_sent / send_count if send_count else 0:.2f} bytes")

    # Verification Logic
    # We generated ~1MB (1,024,000 bytes) of raw data.
    # With 32KB batching, we expect roughly 1MB / 32KB = ~32 sends if uncompressed.
    # With compression, the size will be much smaller, but the batching logic triggers on RAW size (32KB).
    # So we still expect ~32 sends (triggered by size limit).

    if send_count > 1000:
        print("FAIL: Too many sends! Batching is not working.")
    elif send_count < 10:
        print("WARNING: Very few sends. Compression might be extremely effective or data lost.")
    else:
        print("PASS: Send count is within expected range for batched processing.")


if __name__ == "__main__":
    asyncio.run(run_stress_test())
