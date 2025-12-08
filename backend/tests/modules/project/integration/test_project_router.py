from typing import Generator
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.project.domain.entities import Project
from app.modules.project.infrastructure.web.router import get_project_service


@pytest.fixture
def mock_service() -> MagicMock:
    service = AsyncMock()
    service.create_project.return_value = Project(id="p1", name="P1", path="/tmp/p1")
    service.list_projects.return_value = [Project(id="p1", name="P1", path="/tmp/p1")]
    return service


@pytest.fixture
def client(mock_service: MagicMock) -> Generator[TestClient, None, None]:
    app.dependency_overrides[get_project_service] = lambda: mock_service
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_create_project(client: TestClient, mock_service: MagicMock):
    payload = {"name": "P1", "path": "/tmp/p1"}
    response = client.post("/api/v1/projects/", json=payload)

    assert response.status_code == 200
    assert response.json() == {"id": "p1", "name": "P1", "path": "/tmp/p1"}
    mock_service.create_project.assert_called_once_with("P1", "/tmp/p1")


def test_list_projects(client: TestClient, mock_service: MagicMock):
    response = client.get("/api/v1/projects/")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == "p1"
    mock_service.list_projects.assert_called_once()
