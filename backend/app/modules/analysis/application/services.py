from typing import Dict, List, Literal, Optional

from ..infrastructure.adapters.file_watcher import WatchManager
from ..infrastructure.adapters.scoped_notifier import ScopedAnalysisNotifier
from ..infrastructure.adapters.websocket_notifier import WebSocketNotifier
from .engine.orchestrator import AnalysisOrchestrator


class AnalysisOrchestratorService:
    def __init__(self, notifier: WebSocketNotifier):
        self.notifier = notifier
        self.active_watchers: Dict[str, WatchManager] = {}

    async def start_analysis(
        self,
        project_id: str,
        project_path: str,
        mode: Literal["full", "incremental", "watch"] = "full",
        selected_tools: Optional[List[str]] = None,
    ):
        # Create a scoped notifier for this specific analysis run
        scoped_notifier = ScopedAnalysisNotifier(self.notifier, project_id)

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
            import asyncio

            asyncio.create_task(watcher.start_watching())
            return {"status": "started", "mode": "watch"}

        else:
            orchestrator = AnalysisOrchestrator(
                project_path=project_path,
                mode=mode,
                ws_manager=scoped_notifier,
                selected_tools=selected_tools,
            )

            # Execute the analysis
            result = await orchestrator.execute()
            return result

    async def stop_analysis(self, project_id: str):
        if project_id in self.active_watchers:
            await self.active_watchers[project_id].stop()
            del self.active_watchers[project_id]
            return {"status": "stopped"}
        return {"status": "not_found"}
