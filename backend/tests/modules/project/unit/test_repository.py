import pytest

from app.modules.project.domain.entities import Project
from app.modules.project.infrastructure.adapters.json_repository import (
    ProjectJSONRepository,
)


@pytest.fixture
def repo(tmp_path):
    file_path = tmp_path / "projects.json"
    return ProjectJSONRepository(str(file_path))


@pytest.mark.asyncio
async def test_save_and_get_all(repo):
    project = Project(id="p1", name="Project 1", path="/tmp/p1")

    await repo.save(project)
    projects = await repo.get_all()

    assert len(projects) == 1
    assert projects[0].id == "p1"
    assert projects[0].name == "Project 1"


@pytest.mark.asyncio
async def test_get_by_id(repo):
    project = Project(id="p1", name="Project 1", path="/tmp/p1")
    await repo.save(project)

    found = await repo.get_by_id("p1")
    assert found is not None
    assert found.id == "p1"

    not_found = await repo.get_by_id("p2")
    assert not_found is None


@pytest.mark.asyncio
async def test_update_project(repo):
    project = Project(id="p1", name="Project 1", path="/tmp/p1")
    await repo.save(project)

    project.name = "Updated Project 1"
    await repo.save(project)

    found = await repo.get_by_id("p1")
    assert found.name == "Updated Project 1"
