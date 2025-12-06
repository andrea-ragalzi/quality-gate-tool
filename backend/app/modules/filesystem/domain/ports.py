from abc import ABC, abstractmethod
from typing import List


class FilesystemPort(ABC):
    @abstractmethod
    async def list_directory(self, path: str) -> List[str]:
        pass  # pragma: no cover

    @abstractmethod
    async def list_directory_details(self, path: str) -> List[dict]:
        pass  # pragma: no cover

    @abstractmethod
    async def read_file_content(self, path: str) -> str:
        pass  # pragma: no cover

    @abstractmethod
    async def path_exists(self, path: str) -> bool:
        pass  # pragma: no cover
