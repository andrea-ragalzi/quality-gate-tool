import json
from pathlib import Path
from typing import List, Optional

from ...domain.entities import Project
from ...domain.ports import ProjectRepositoryPort


class ProjectJSONRepository(ProjectRepositoryPort):
    def __init__(self, file_path: str = "projects.json"):
        self.file_path = Path(file_path)
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        if not self.file_path.exists():
            with open(self.file_path, "w") as f:
                json.dump([], f)

    def _read_data(self) -> List[dict]:
        with open(self.file_path, "r") as f:
            return json.load(f)

    def _write_data(self, data: List[dict]):
        with open(self.file_path, "w") as f:
            json.dump(data, f, indent=2)

    async def get_all(self) -> List[Project]:
        data = self._read_data()
        return [Project(**item) for item in data]

    async def get_by_id(self, project_id: str) -> Optional[Project]:
        projects = await self.get_all()
        for project in projects:
            if project.id == project_id:
                return project
        return None

    async def save(self, project: Project) -> Project:
        projects = await self.get_all()
        existing_index = next((i for i, p in enumerate(projects) if p.id == project.id), -1)

        if existing_index >= 0:
            projects[existing_index] = project
        else:
            projects.append(project)

        self._write_data([p.model_dump() for p in projects])
        return project
