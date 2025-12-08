import logging
from typing import Any, Dict

from ...domain.ports import AnalysisNotifierPort
from ...infrastructure.adapters.websocket_notifier import WebSocketNotifier

logger = logging.getLogger(__name__)


class ScopedAnalysisNotifier(AnalysisNotifierPort):
    def __init__(self, notifier: WebSocketNotifier, project_id: str):
        self.notifier = notifier
        self.project_id = project_id

    async def send_update(self, project_id: str, message: Dict[str, Any]):
        # Ignores passed project_id, uses scoped one, or maybe validates it?
        # The interface has project_id, but Orchestrator calls other methods.
        logger.debug(f"Sending WS update to {self.project_id}: {message.get('type')}")
        await self.notifier.send_update(self.project_id, message)

    async def send_global_init(self):
        await self.notifier.send_update(self.project_id, {"type": "GLOBAL_INIT"})

    async def broadcast_raw(self, message: Dict[str, Any]):
        await self.notifier.send_update(self.project_id, message)

    async def send_global_end(self, status: str):
        await self.notifier.send_update(self.project_id, {"type": "GLOBAL_END", "status": status})

    async def send_init(self, module_id: str):
        await self.notifier.send_update(self.project_id, {"type": "INIT", "module": module_id})

    async def send_log(self, module_id: str, message: str):
        await self.notifier.send_update(
            self.project_id, {"type": "LOG", "module": module_id, "data": message}
        )

    async def send_stream(self, module_id: str, chunk: str):
        await self.notifier.send_update(
            self.project_id, {"type": "STREAM", "module": module_id, "data": chunk}
        )

    async def send_end(self, module_id: str, status: str, summary: str):
        await self.notifier.send_update(
            self.project_id,
            {
                "type": "END",
                "module": module_id,
                "status": status,
                "summary": summary,
            },
        )

    async def send_error(self, module_id: str, error: str):
        await self.notifier.send_update(
            self.project_id,
            {"type": "ERROR", "module": module_id, "error": error},
        )
