from abc import ABC, abstractmethod
from typing import Any, Dict


class AnalysisNotifierPort(ABC):
    @abstractmethod
    async def send_update(self, project_id: str, message: Dict[str, Any]):
        pass  # pragma: no cover

    @abstractmethod
    async def send_global_init(self):
        pass  # pragma: no cover

    @abstractmethod
    async def broadcast_raw(self, message: Dict[str, Any]):
        pass  # pragma: no cover

    @abstractmethod
    async def send_global_end(self, status: str):
        pass  # pragma: no cover

    @abstractmethod
    async def send_init(self, module_id: str):
        pass  # pragma: no cover

    @abstractmethod
    async def send_log(self, module_id: str, message: str):
        pass  # pragma: no cover

    @abstractmethod
    async def send_stream(self, module_id: str, chunk: str):
        pass  # pragma: no cover

    @abstractmethod
    async def send_end(self, module_id: str, status: str, summary: str):
        pass  # pragma: no cover

    @abstractmethod
    async def send_error(self, module_id: str, error: str):
        pass  # pragma: no cover
