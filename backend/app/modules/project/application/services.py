from typing import List

from ..domain.entities import Project
from ..domain.ports import ProjectRepositoryPort


class ProjectService:
    def __init__(self, repository: ProjectRepositoryPort):
        self.repository = repository

    async def create_project(self, name: str, path: str) -> Project:
        project_id = name.lower().replace(" ", "-")
        project = Project(id=project_id, name=name, path=path)
        return await self.repository.save(project)

    async def list_projects(self) -> List[Project]:
        return await self.repository.get_all()
