import logging
from typing import Any

from fastapi import WebSocket

# from ...domain.ports import AnalysisNotifierPort # Not needed if we don't inherit

logger = logging.getLogger(__name__)


class WebSocketNotifier:
    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: str) -> None:
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)
        logger.info(f"WS Connected: {project_id} (Total: {len(self.active_connections[project_id])})")

    def disconnect(self, websocket: WebSocket, project_id: str) -> None:
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

    async def send_update(self, project_id: str, message: dict[str, Any]) -> None:
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending WS message: {e}")
        else:
            logger.warning(f"No active WS connections for project_id: {project_id}")
