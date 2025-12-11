from abc import ABC, abstractmethod

from .entities import Project


class ProjectRepositoryPort(ABC):
    @abstractmethod
    async def get_all(self) -> list[Project]:
        pass  # pragma: no cover

    @abstractmethod
    async def get_by_id(self, project_id: str) -> Project | None:
        pass  # pragma: no cover

    @abstractmethod
    async def save(self, project: Project) -> Project:
        pass  # pragma: no cover
