from abc import ABC, abstractmethod
from typing import Any


class FilesystemPort(ABC):
    @abstractmethod
    async def list_directory(self, path: str) -> list[str]:
        pass  # pragma: no cover

    @abstractmethod
    async def list_directory_details(self, path: str) -> list[dict[str, Any]]:
        pass  # pragma: no cover

    @abstractmethod
    async def read_file_content(self, path: str) -> str:
        pass  # pragma: no cover

    @abstractmethod
    async def path_exists(self, path: str) -> bool:
        pass  # pragma: no cover
