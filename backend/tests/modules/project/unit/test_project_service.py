from unittest.mock import AsyncMock

import pytest

from app.modules.project.application.services import ProjectService
from app.modules.project.domain.entities import Project
from app.modules.project.domain.ports import ProjectRepositoryPort


@pytest.fixture
def mock_repo():
    return AsyncMock(spec=ProjectRepositoryPort)


@pytest.fixture
def service(mock_repo):
    return ProjectService(mock_repo)


@pytest.mark.asyncio
async def test_create_project(service, mock_repo):
    # Arrange
    mock_repo.save.side_effect = lambda p: p

    # Act
    project = await service.create_project("My Project", "/tmp/my-project")

    # Assert
    assert project.id == "my-project"
    assert project.name == "My Project"
    assert project.path == "/tmp/my-project"
    mock_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_list_projects(service, mock_repo):
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
