from typing import Literal

from ..infrastructure.adapters.file_watcher import WatchManager
from ..infrastructure.adapters.scoped_notifier import ScopedAnalysisNotifier
from ..infrastructure.adapters.websocket_notifier import WebSocketNotifier
from .engine.modules import MODULE_METADATA
from .engine.orchestrator import AnalysisOrchestrator


class AnalysisOrchestratorService:
    def __init__(self, notifier: WebSocketNotifier) -> None:
        self.notifier = notifier
        self.active_watchers: dict[str, WatchManager] = {}
        self.active_analyses: set[str] = set()

    def get_available_tools(self) -> list[dict[str, str]]:
        return MODULE_METADATA

    async def start_analysis(
        self,
        project_id: str,
        project_path: str,
        mode: Literal["full", "incremental", "watch"] = "full",
        selected_tools: list[str] | None = None,
    ) -> dict[str, str]:
        # Check for conflicts
        if project_id in self.active_analyses or (mode != "watch" and project_id in self.active_watchers):
            # If watch mode is active, we might allow full analysis?
            # For now, strict conflict: if anything is running, 409.
            # Exception: if mode is watch and we are already watching, we restart (handled below).
            # But if we are running a full analysis, we shouldn't start another.
            if project_id in self.active_analyses:
                raise RuntimeError("Analysis already running")

        # Create a scoped notifier for this specific analysis run
        scoped_notifier = ScopedAnalysisNotifier(self.notifier, project_id)

        import asyncio

        if mode == "watch":
            # Stop existing watcher if any
            if project_id in self.active_watchers:
                await self.active_watchers[project_id].stop()

            watcher = WatchManager(
                project_path=project_path,
                ws_manager=scoped_notifier,
                selected_tools=selected_tools,
            )
            self.active_watchers[project_id] = watcher

            # Start watching in background
            asyncio.create_task(watcher.start_watching())
            return {"status": "accepted", "mode": "watch"}

        else:
            orchestrator = AnalysisOrchestrator(
                project_path=project_path,
                mode=mode,
                ws_manager=scoped_notifier,
                selected_tools=selected_tools,
            )

            self.active_analyses.add(project_id)

            async def _run_background() -> None:
                try:
                    await orchestrator.execute()
                finally:
                    self.active_analyses.discard(project_id)

            # Execute the analysis in background
            asyncio.create_task(_run_background())
            return {"status": "accepted", "mode": mode}

    async def stop_analysis(self, project_id: str) -> dict[str, str]:
        if project_id in self.active_watchers:
            await self.active_watchers[project_id].stop()
            del self.active_watchers[project_id]
            return {"status": "stopped"}
        # We can't easily stop a running full analysis task without keeping a reference to the task
        # For now, we only stop watchers.
        return {"status": "not_found"}
