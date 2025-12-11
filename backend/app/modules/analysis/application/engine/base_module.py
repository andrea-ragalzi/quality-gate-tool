"""
Base Module Interface
All analysis modules must implement this interface
"""

import asyncio
import base64
import contextlib
import gzip
import logging
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Literal

from ...domain.ports import AnalysisNotifierPort
from ...infrastructure.log_parser import QualityLogParser

logger = logging.getLogger(__name__)


class AnalysisModule(ABC):
    """
    Base class for all analysis modules
    Provides subprocess execution with real-time streaming
    """

    def __init__(
        self,
        module_id: str,
        name: str,
        project_path: str,
        ws_manager: AnalysisNotifierPort,
    ) -> None:
        self.module_id = module_id
        self.name = name
        self.project_path = Path(project_path)
        self.ws_manager = ws_manager
        self.status: Literal["PENDING", "RUNNING", "PASS", "FAIL", "SKIPPED"] = "PENDING"
        self.exit_code: int | None = None
        self.config_warning: str | None = None

    @abstractmethod
    def get_command(self, files: list[str] | None = None) -> list[str]:
        """
        Return command to execute as list of strings
        files: optional list of files for incremental mode
        """
        pass

    @abstractmethod
    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        """Parse command output and return summary string"""
        pass

    async def run(self, files: list[str] | None = None) -> Literal["PASS", "FAIL", "SKIPPED"]:
        """
        Execute module with real-time log streaming and RESOURCE CLEANUP
        CRITICAL: Ensures immediate flushing and proper process termination
        Returns PASS if exit_code == 0, FAIL otherwise, SKIPPED if filtered
        """
        process = None
        try:
            # Get command first to check for filtering
            cmd = self.get_command(files)

            if not cmd:
                logger.info(f"[{self.module_id}] No command to execute (filtered). Skipping.")
                # Do NOT send END message to preserve previous state in UI
                return "SKIPPED"

            # Send INIT message only if we are actually running
            await self.ws_manager.send_init(self.module_id)
            self.status = "RUNNING"

            # Send configuration warning if any
            if self.config_warning:
                await self.ws_manager.send_log(self.module_id, f"⚠️ {self.config_warning}")

            # CRITICAL: Add unbuffered flag for Python commands
            if cmd[0] in ["python", "python3"]:
                cmd.insert(1, "-u")  # Unbuffered output

            # Log command execution
            cmd_str = " ".join(cmd)
            await self.ws_manager.send_log(self.module_id, f"$ {cmd_str}")

            # Execute subprocess with real-time streaming and proper limits
            # Start process with decoupled I/O
            # Use DEVNULL for stdin to prevent hanging on interactive prompts
            logger.info(f"[{self.module_id}] Starting subprocess: {cmd_str}")
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                stdin=asyncio.subprocess.DEVNULL,
                cwd=str(self.project_path),
                limit=1024 * 64,  # 64KB buffer limit to prevent memory bloat
            )
            logger.info(f"[{self.module_id}] Subprocess started with PID: {process.pid}")

            # Capture output for summary
            stdout_chunks: list[str] = []
            stderr_chunks: list[str] = []

            # Decoupled I/O: Queue for log streaming
            # Unbounded (or large) queue to prevent reader from blocking on network
            log_queue: asyncio.Queue[str | None] = asyncio.Queue()

            async def stream_reader(stream: asyncio.StreamReader, chunks_list: list[str]) -> None:
                """Reads from pipe and puts into queue immediately"""
                if not stream:
                    return
                while True:
                    chunk = await stream.read(8192)
                    if not chunk:
                        break
                    logger.debug(f"[{self.module_id}] Read {len(chunk)} bytes from pipe")
                    decoded = chunk.decode("utf-8", errors="replace")
                    chunks_list.append(decoded)
                    await log_queue.put(decoded)

            async def stream_sender() -> None:
                """Consumes from queue and sends via WebSocket with throttling and compression"""
                buffer: list[str] = []
                buffer_size = 0
                batch_start_time = 0.0

                async def send_buffer(trigger: str) -> None:
                    nonlocal buffer, buffer_size
                    if not buffer:
                        return

                    raw_text = "".join(buffer)
                    logger.debug(f"[{self.module_id}] Sending batch of {len(raw_text)} bytes. Trigger: {trigger}")

                    # Compress if larger than 1KB
                    if len(raw_text) > 1024:
                        try:
                            compressed = gzip.compress(raw_text.encode("utf-8"))
                            b64_encoded = base64.b64encode(compressed).decode("ascii")
                            await self.ws_manager.send_stream(self.module_id, b64_encoded, encoding="gzip_base64")
                        except Exception as e:
                            logger.error(f"Compression failed: {e}, sending raw")
                            await self.ws_manager.send_stream(self.module_id, raw_text)
                    else:
                        await self.ws_manager.send_stream(self.module_id, raw_text)

                    buffer = []
                    buffer_size = 0
                    logger.debug(f"[{self.module_id}] Buffer reset after send")

                while True:
                    try:
                        if not buffer:
                            # If buffer is empty, wait indefinitely for the first chunk
                            # This avoids busy looping when idle
                            chunk = await log_queue.get()
                            batch_start_time = time.time()
                        else:
                            # If buffer has data, enforce 100ms max latency
                            elapsed = time.time() - batch_start_time
                            timeout = max(0.1 - elapsed, 0.01)
                            chunk = await asyncio.wait_for(log_queue.get(), timeout=timeout)

                        if chunk is None:
                            if buffer:
                                await send_buffer("Final Flush")
                            log_queue.task_done()
                            break

                        buffer.append(chunk)
                        buffer_size += len(chunk)

                        if buffer_size > 32768:
                            await send_buffer("Size Limit")

                        log_queue.task_done()

                    except TimeoutError:
                        # Timeout reached (100ms since first chunk in batch), flush
                        if buffer:
                            await send_buffer("Time Limit")

            # Start sender task
            sender_task = asyncio.create_task(stream_sender())

            # Run readers in background tasks
            stdout_reader = asyncio.create_task(stream_reader(process.stdout, stdout_chunks))
            stderr_reader = asyncio.create_task(stream_reader(process.stderr, stderr_chunks))

            try:
                # Wait for process to exit OR readers to fail
                # We wrap process.wait() in a task to wait for it alongside readers
                process_task = asyncio.create_task(process.wait())

                # We wait for the FIRST completion.
                # If process finishes, we then wait for readers to drain.
                # If a reader fails (crashes), we abort immediately to prevent deadlock.
                logger.info(f"[{self.module_id}] Waiting for process or readers...")
                done, pending = await asyncio.wait(
                    [process_task, stdout_reader, stderr_reader],
                    return_when=asyncio.FIRST_COMPLETED,
                )
                logger.info(f"[{self.module_id}] Wait finished. Done: {len(done)}, Pending: {len(pending)}")

                # Check for failures in completed tasks
                for task in done:
                    if task.exception():
                        logger.error(f"[{self.module_id}] Task failed with exception: {task.exception()}")
                        # If any task failed, re-raise the exception to abort execution
                        raise task.exception()

                # If process is not done, it means a reader finished (EOF) without error.
                # This implies the process closed the pipe but is still running.
                # We should continue waiting for the process.
                if process_task not in done:
                    logger.info(f"[{self.module_id}] Process still running, waiting for it...")
                    await process_task
                    logger.info(f"[{self.module_id}] Process finished.")

                # Process is done (or was done in the first place).
                # Now ensure readers finish draining (with timeout)
                try:
                    logger.info(f"[{self.module_id}] Draining readers...")
                    await asyncio.wait_for(asyncio.gather(stdout_reader, stderr_reader), timeout=5.0)
                    logger.info(f"[{self.module_id}] Readers drained successfully.")
                except TimeoutError:
                    logger.warning(f"[{self.module_id}] Readers timed out (pipes kept open?), cancelling...")
                    stdout_reader.cancel()
                    stderr_reader.cancel()
                    with contextlib.suppress(asyncio.CancelledError):
                        await asyncio.gather(stdout_reader, stderr_reader)

            except asyncio.CancelledError:
                # Cancel readers
                stdout_reader.cancel()
                stderr_reader.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await asyncio.gather(stdout_reader, stderr_reader)

                # Ensure we clean up sender if cancelled
                sender_task.cancel()
                logger.warning(f"[{self.module_id}] Module execution cancelled")
                if process and process.returncode is None:
                    try:
                        process.terminate()
                        # Give it a moment to terminate gracefully
                        try:
                            await asyncio.wait_for(process.wait(), timeout=2.0)
                        except TimeoutError:
                            logger.warning(f"[{self.module_id}] Process did not terminate, killing...")
                            process.kill()
                    except Exception as e:
                        logger.error(f"[{self.module_id}] Failed to kill process: {e}")
                raise

            # Signal sender to stop and wait for it
            await log_queue.put(None)
            await sender_task

            self.exit_code = process.returncode
            logger.info(f"[{self.module_id}] Process finished with exit code {self.exit_code}")

            # Determine status
            self.status = "PASS" if self.exit_code == 0 else "FAIL"

            # Generate summary
            stdout_str = "".join(stdout_chunks)
            stderr_str = "".join(stderr_chunks)
            summary = self.get_summary(stdout_str, stderr_str, self.exit_code or 1)

            # Parse logs and send metrics
            try:
                parser = QualityLogParser()
                # Combine stdout and stderr for parsing
                full_log = stdout_str + "\n" + stderr_str
                metrics_report = parser.parse_content(full_log, self.module_id)

                # Send metrics
                await self.ws_manager.send_metrics(self.module_id, metrics_report)
            except Exception as e:
                logger.error(f"Failed to parse logs for {self.module_id}: {e}")

            # Send END message
            await self.ws_manager.send_end(self.module_id, self.status, summary)

            return self.status

        except asyncio.CancelledError:
            logger.warning(f"🛑 Module {self.module_id} execution cancelled")
            self.status = "FAIL"
            await self.ws_manager.send_end(self.module_id, "FAIL", "🛑 Execution cancelled")
            raise
        except Exception as e:
            logger.error(f"Module {self.module_id} failed: {e}", exc_info=True)
            self.status = "FAIL"
            await self.ws_manager.send_error(self.module_id, f"Exception: {str(e)}")
            await self.ws_manager.send_end(self.module_id, "FAIL", f"Exception: {str(e)}")
            return "FAIL"
        finally:
            # CRITICAL: Ensure process is properly terminated and cleaned up
            if process and process.returncode is None:
                logger.info(f"🛑 Terminating process for {self.module_id} (in finally block)...")
                try:
                    process.terminate()
                    # Give it a short moment to die gracefully
                    await asyncio.wait_for(process.wait(), timeout=1.0)
                except (TimeoutError, Exception):
                    logger.warning(f"⚠️ Force killing {self.module_id}...")
                    try:
                        process.kill()
                        await process.wait()
                    except Exception as e:
                        logger.error(f"Failed to kill process: {e}")
                logger.info(f"✅ Process for {self.module_id} terminated")
            else:
                logger.debug(f"[{self.module_id}] Cleanup: Process already finished.")
