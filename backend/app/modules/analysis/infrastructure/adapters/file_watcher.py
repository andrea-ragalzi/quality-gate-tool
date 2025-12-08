"""
Live Watch Manager V5.0 - Mission Critical Stability
Continuous filesystem monitoring with DEBOUNCING and strict filtering
Prevents resource exhaustion through controlled event handling
"""

import asyncio
import logging
import threading
from concurrent.futures import Future
from pathlib import Path
from typing import Any, Callable, Coroutine, List, Optional, Set

from watchdog.events import FileSystemEventHandler
from watchdog.observers.polling import PollingObserver

from ...application.engine.orchestrator import AnalysisOrchestrator
from ...domain.ports import AnalysisNotifierPort

logger = logging.getLogger(__name__)


class CodeChangeHandler(FileSystemEventHandler):
    """
    Handler for filesystem events with DEBOUNCING (Mission Critical)
    Prevents rapid-fire analysis triggers that cause RAM exhaustion
    """

    def __init__(
        self,
        project_path: str,
        callback: Callable[[List[str]], Coroutine[Any, Any, None]],
        loop: asyncio.AbstractEventLoop,
    ):
        self.project_path = Path(project_path)
        self.callback = callback
        self.loop = loop  # Store event loop reference from main thread
        self.modified_files: Set[str] = set()
        self._lock = threading.Lock()  # Thread safety for shared state
        self.debounce_task: Optional[Future[Any]] = None  # Future from run_coroutine_threadsafe
        # CRITICAL: Debounce delay to ensure file write completion
        self.debounce_delay = 0.1  # 100ms debounce as per briefing
        self.is_analyzing = False  # Prevent overlapping analysis runs

    def on_modified(self, event: Any):
        logger.debug(
            f"🔍 Watchdog detected modification: {event.src_path} (is_dir: {event.is_directory})"
        )
        if event.is_directory:
            return
        path: Any = event.src_path
        if isinstance(path, bytes):
            path = path.decode("utf-8")
        self._handle_change(str(path))

    def on_created(self, event: Any):
        logger.debug(
            f"🔍 Watchdog detected creation: {event.src_path} (is_dir: {event.is_directory})"
        )
        if event.is_directory:
            return
        path: Any = event.src_path
        if isinstance(path, bytes):
            path = path.decode("utf-8")
        self._handle_change(str(path))

    def _handle_change(self, file_path: str):
        """Track file change and schedule debounced analysis"""
        # Filter relevant files only
        if self._is_relevant_file(file_path):
            try:
                rel_path = str(Path(file_path).relative_to(self.project_path))

                with self._lock:
                    self.modified_files.add(rel_path)
                    logger.info(f"📝 File changed: {rel_path}")

                    # If analysis is running, we just queue the file (it's already in modified_files)
                    # The running _debounced_analysis loop will pick it up.
                    if self.is_analyzing:
                        logger.debug(f"⏳ Analysis in progress, queuing change for: {rel_path}")
                        return

                    # Cancel previous debounce task if it's just waiting
                    if self.debounce_task and not self.debounce_task.done():
                        self.debounce_task.cancel()

                    # CRITICAL: Use stored loop reference instead of get_event_loop()
                    # This works because watchdog runs in a separate thread
                    self.debounce_task = asyncio.run_coroutine_threadsafe(
                        self._debounced_analysis(), self.loop
                    )
            except ValueError:
                # File is outside project path
                pass
        else:
            logger.debug(f"🗑️ File ignored: {file_path}")

    def _is_relevant_file(self, file_path: str) -> bool:
        """
        CRITICAL: Rigorous filtering to prevent unnecessary analysis triggers
        Only source code files, exclude all temp/cache/dependency folders
        """
        relevant_extensions = {
            ".py",
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".json",
            ".yaml",
            ".yml",
            ".toml",
        }

        # CRITICAL: Ignore patterns to prevent fork bomb
        ignore_patterns = {
            "node_modules",
            ".git",
            "__pycache__",
            ".venv",
            "venv",
            "dist",
            "build",
            ".next",
            ".cache",
            "coverage",
            ".pytest_cache",
            ".mypy_cache",
            ".tox",
            "htmlcov",
            "eggs",
            ".eggs",
            "tmp",
            "temp",
            ".tmp",
            ".swp",
            ".swo",
            "~",
        }

        path = Path(file_path)

        # Check if in ignored directory
        # CRITICAL: Check relative path parts to avoid false positives from parent directories (e.g. /tmp)
        try:
            check_parts = path.relative_to(self.project_path).parts
        except ValueError:
            # Fallback to full path if not relative (should not happen for relevant files)
            check_parts = path.parts

        for part in check_parts:
            if part in ignore_patterns:
                return False
            # Also check for hidden files
            if part.startswith(".") and part not in {".github", ".gitlab"}:
                return False

        return path.suffix in relevant_extensions

    async def _debounced_analysis(self) -> None:
        """
        CRITICAL: Wait for debounce delay before triggering analysis
        Ensures file write is complete and groups rapid saves.
        Loops to handle changes that occurred during analysis.
        """
        try:
            # Initial debounce
            await asyncio.sleep(self.debounce_delay)

            while True:
                files = []
                with self._lock:
                    if not self.modified_files:
                        break

                    # If we are already analyzing (should not happen here due to logic, but safety)
                    if self.is_analyzing:
                        break

                    files = list(self.modified_files)
                    self.modified_files.clear()
                    self.is_analyzing = True

                if not files:
                    break

                logger.info(f"🔄 Triggering incremental analysis for {len(files)} file(s)")
                try:
                    await self.callback(files)
                finally:
                    with self._lock:
                        self.is_analyzing = False
                    logger.info("✅ Analysis complete")

                # Small pause to allow batching of pending changes
                if self.modified_files:
                    logger.info("🔄 Pending changes detected, re-triggering analysis...")
                    await asyncio.sleep(self.debounce_delay)

        except asyncio.CancelledError:
            logger.debug("Debounce cancelled, new change detected")
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            with self._lock:
                self.is_analyzing = False


class WatchManager:
    """
    Manages live watch mode
    Continuous filesystem monitoring with automatic analysis
    """

    def __init__(
        self,
        project_path: str,
        ws_manager: AnalysisNotifierPort,
        selected_tools: Optional[list[str]] = None,
    ):
        self.project_path = Path(project_path)
        self.ws_manager = ws_manager
        self.selected_tools = selected_tools
        self.observer: Optional[PollingObserver] = None
        self.is_running = False
        self.stop_event = asyncio.Event()
        self.active_analysis_task: Optional[asyncio.Task[Any]] = None

    async def start_watching(self):
        """Start live watch mode"""
        if self.is_running:
            logger.warning("Watch mode already running")
            return

        self.is_running = True
        self.stop_event.clear()

        logger.info(f"👁️  Starting live watch on: {self.project_path}")
        await self.ws_manager.broadcast_raw(
            {
                "type": "LOG",
                "message": f"👁️  Live Watch Mode ACTIVATED on {self.project_path}",
            }
        )

        # CRITICAL: Pass event loop to handler for thread-safe task scheduling
        loop = asyncio.get_running_loop()
        handler = CodeChangeHandler(str(self.project_path), callback=self._run_analysis, loop=loop)

        # Create and start observer (using PollingObserver for Docker volumes)
        self.observer = PollingObserver()
        self.observer.schedule(handler, str(self.project_path), recursive=True)
        self.observer.start()

        logger.info("✅ Watch mode started successfully (using polling observer)")

        # CRITICAL: Run initial full analysis on watch start
        logger.info("🚀 Running initial full analysis...")
        await self.ws_manager.broadcast_raw(
            {
                "type": "LOG",
                "message": "🚀 Running initial full scan...",
            }
        )

        try:
            self.active_analysis_task = asyncio.current_task()
            orchestrator = AnalysisOrchestrator(
                project_path=str(self.project_path),
                mode="full",
                ws_manager=self.ws_manager,
                selected_tools=self.selected_tools,
            )
            await orchestrator.execute()
            logger.info("✅ Initial analysis completed")
        except asyncio.CancelledError:
            logger.info("🛑 Initial analysis cancelled")
            raise
        except Exception as e:
            logger.error(f"❌ Initial analysis failed: {e}", exc_info=True)
            await self.ws_manager.broadcast_raw(
                {"type": "ERROR", "message": f"Initial analysis failed: {str(e)}"}
            )
        finally:
            self.active_analysis_task = None

        # Keep running until stopped
        try:
            await self.stop_event.wait()
        finally:
            await self.stop_watching()

    async def stop(self):
        """Stop live watch mode"""
        await self.stop_watching()

    async def stop_watching(self):
        """Stop live watch mode"""
        if not self.is_running:
            return

        logger.info("🛑 Stopping live watch mode...")

        # Cancel any active analysis task
        if self.active_analysis_task:
            logger.info("🛑 Cancelling active analysis task...")
            self.active_analysis_task.cancel()
            try:
                await self.active_analysis_task
            except asyncio.CancelledError:
                pass
            self.active_analysis_task = None

        await self.ws_manager.broadcast_raw(
            {"type": "LOG", "message": "🛑 Live Watch Mode DEACTIVATED"}
        )

        if self.observer:
            self.observer.stop()
            try:
                if self.observer.is_alive():
                    self.observer.join(timeout=5)
            except RuntimeError:
                pass
            self.observer = None

        self.is_running = False
        self.stop_event.set()

        logger.info("✅ Watch mode stopped")

    async def _run_analysis(self, files: List[str]):
        """Callback to run incremental analysis"""
        try:
            self.active_analysis_task = asyncio.current_task()
            await self.ws_manager.broadcast_raw(
                {
                    "type": "LOG",
                    "message": f"🔄 Auto-triggering analysis for {len(files)} modified file(s)",
                }
            )

            # Create orchestrator in incremental mode
            orchestrator = AnalysisOrchestrator(
                project_path=str(self.project_path),
                mode="incremental",
                ws_manager=self.ws_manager,
                selected_tools=self.selected_tools,
            )

            # Execute analysis with explicit file list
            result = await orchestrator.execute(files=files)

            logger.info(f"✅ Auto-analysis completed: {result.get('status')}")

        except asyncio.CancelledError:
            logger.info("🛑 Auto-analysis cancelled")
            raise
        except Exception as e:
            logger.error(f"❌ Auto-analysis failed: {e}", exc_info=True)
            await self.ws_manager.broadcast_raw(
                {"type": "ERROR", "message": f"Auto-analysis failed: {str(e)}"}
            )
        finally:
            self.active_analysis_task = None

    def request_stop(self):
        """Request watch mode to stop (non-blocking)"""
        logger.info("🛑 Stop requested for watch mode")
        self.stop_event.set()
