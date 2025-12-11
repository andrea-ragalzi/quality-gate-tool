"""
Base Module Interface
All analysis modules must implement this interface
"""

import asyncio
import logging
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
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.project_path),
                limit=1024 * 64,  # 64KB buffer limit to prevent memory bloat
            )

            # Capture output for summary
            stdout_chunks: list[str] = []
            stderr_chunks: list[str] = []

            # Stream stdout in real-time
            async def stream_stdout() -> None:
                if process and process.stdout:
                    while True:
                        chunk = await process.stdout.read(64)
                        if not chunk:
                            break
                        decoded = chunk.decode("utf-8", errors="replace")
                        stdout_chunks.append(decoded)
                        await self.ws_manager.send_stream(self.module_id, decoded)

            # Stream stderr in real-time
            async def stream_stderr() -> None:
                if process and process.stderr:
                    while True:
                        chunk = await process.stderr.read(64)
                        if not chunk:
                            break
                        decoded = chunk.decode("utf-8", errors="replace")
                        stderr_chunks.append(decoded)
                        await self.ws_manager.send_stream(self.module_id, decoded)

            # Run both streams concurrently and wait for process
            try:
                await asyncio.gather(stream_stdout(), stream_stderr(), process.wait())
            except asyncio.CancelledError:
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

            self.exit_code = process.returncode

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
            logger.error(f"Module {self.module_id} failed: {e}")
            self.status = "FAIL"
            await self.ws_manager.send_error(self.module_id, f"Exception: {str(e)}")
            return "FAIL"
        finally:
            # CRITICAL: Ensure process is properly terminated and cleaned up
            if process and process.returncode is None:
                logger.info(f"🛑 Terminating process for {self.module_id}...")
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
