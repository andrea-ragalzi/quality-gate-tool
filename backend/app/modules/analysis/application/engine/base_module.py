"""
Base Module Interface
All analysis modules must implement this interface
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Literal

from ...domain.ports import AnalysisNotifierPort

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
    ):
        self.module_id = module_id
        self.name = name
        self.project_path = Path(project_path)
        self.ws_manager = ws_manager
        self.status: Literal["PENDING", "RUNNING", "PASS", "FAIL"] = "PENDING"
        self.exit_code = None

    @abstractmethod
    def get_command(self, files: List[str] = None) -> List[str]:
        """
        Return command to execute as list of strings
        files: optional list of files for incremental mode
        """
        pass

    @abstractmethod
    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        """Parse command output and return summary string"""
        pass

    async def run(self, files: List[str] = None) -> Literal["PASS", "FAIL"]:
        """
        Execute module with real-time log streaming and RESOURCE CLEANUP
        CRITICAL: Ensures immediate flushing and proper process termination
        Returns PASS if exit_code == 0, FAIL otherwise
        """
        process = None
        try:
            # Send INIT message
            await self.ws_manager.send_init(self.module_id)
            self.status = "RUNNING"

            # Get command
            cmd = self.get_command(files)

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
            stdout_chunks = []
            stderr_chunks = []

            # Stream stdout in real-time
            async def stream_stdout():
                while True:
                    chunk = await process.stdout.read(64)
                    if not chunk:
                        break
                    decoded = chunk.decode("utf-8", errors="replace")
                    stdout_chunks.append(decoded)
                    await self.ws_manager.send_stream(self.module_id, decoded)

            # Stream stderr in real-time
            async def stream_stderr():
                while True:
                    chunk = await process.stderr.read(64)
                    if not chunk:
                        break
                    decoded = chunk.decode("utf-8", errors="replace")
                    stderr_chunks.append(decoded)
                    await self.ws_manager.send_stream(self.module_id, decoded)

            # Run both streams concurrently and wait for process
            await asyncio.gather(stream_stdout(), stream_stderr(), process.wait())

            self.exit_code = process.returncode

            # Determine status
            self.status = "PASS" if self.exit_code == 0 else "FAIL"

            # Generate summary
            stdout_str = "".join(stdout_chunks)
            stderr_str = "".join(stderr_chunks)
            summary = self.get_summary(stdout_str, stderr_str, self.exit_code)

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
                except (asyncio.TimeoutError, Exception):
                    logger.warning(f"⚠️ Force killing {self.module_id}...")
                    try:
                        process.kill()
                        await process.wait()
                    except Exception as e:
                        logger.error(f"Failed to kill process: {e}")
                logger.info(f"✅ Process for {self.module_id} terminated")
