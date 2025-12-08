from abc import ABC, abstractmethod
from typing import Any


class AnalysisNotifierPort(ABC):
    @abstractmethod
    async def send_update(self, project_id: str, message: dict[str, Any]) -> None:
        pass  # pragma: no cover

    @abstractmethod
    async def send_global_init(self) -> None:
        pass  # pragma: no cover

    @abstractmethod
    async def broadcast_raw(self, message: dict[str, Any]) -> None:
        pass  # pragma: no cover

    @abstractmethod
    async def send_global_end(self, status: str) -> None:
        pass  # pragma: no cover

    @abstractmethod
    async def send_init(self, module_id: str) -> None:
        pass  # pragma: no cover

    @abstractmethod
    async def send_log(self, module_id: str, message: str) -> None:
        pass  # pragma: no cover

    @abstractmethod
    async def send_stream(self, module_id: str, chunk: str) -> None:
        pass  # pragma: no cover

    @abstractmethod
    async def send_end(self, module_id: str, status: str, summary: str) -> None:
        pass  # pragma: no cover

    @abstractmethod
    async def send_metrics(self, module_id: str, metrics: dict[str, Any]) -> None:
        pass  # pragma: no cover

    @abstractmethod
    async def send_error(self, module_id: str, error: str) -> None:
        pass  # pragma: no cover
