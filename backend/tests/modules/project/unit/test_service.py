from unittest.mock import AsyncMock, MagicMock

import pytest

from app.modules.project.application.services import ProjectService
from app.modules.project.domain.entities import Project
from app.modules.project.domain.ports import ProjectRepositoryPort


@pytest.fixture
def mock_repo() -> MagicMock:
    return AsyncMock(spec=ProjectRepositoryPort)


@pytest.fixture
def service(mock_repo: MagicMock) -> ProjectService:
    return ProjectService(mock_repo)


@pytest.mark.asyncio
async def test_create_project(service: ProjectService, mock_repo: MagicMock):
    # Arrange
    def return_project(p: Project) -> Project:
        return p

    mock_repo.save.side_effect = return_project

    # Act
    project = await service.create_project("My Project", "/tmp/my-project")

    # Assert
    assert project.id == "my-project"
    assert project.name == "My Project"
    assert project.path == "/tmp/my-project"
    mock_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_list_projects(service: ProjectService, mock_repo: MagicMock):
    # Arrange
    mock_repo.get_all.return_value = [
        Project(id="p1", name="P1", path="/p1"),
        Project(id="p2", name="P2", path="/p2"),
    ]

    # Act
    projects = await service.list_projects()

    # Assert
    assert len(projects) == 2
    mock_repo.get_all.assert_called_once()
