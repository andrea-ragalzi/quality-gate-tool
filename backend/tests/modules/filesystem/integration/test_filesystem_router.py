from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.filesystem.infrastructure.web.router import get_filesystem_service


@pytest.fixture
def mock_service():
    service = AsyncMock()
    service.list_files.return_value = ["file1.txt", "dir1"]
    return service


@pytest.fixture
def client(mock_service):
    app.dependency_overrides[get_filesystem_service] = lambda: mock_service
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_list_files_success(client, mock_service):
    response = client.get("/api/v1/fs/?path=/tmp")

    assert response.status_code == 200
    assert response.json() == ["file1.txt", "dir1"]
    mock_service.list_files.assert_called_once_with("/tmp")


def test_list_files_error(client, mock_service):
    mock_service.list_files.side_effect = ValueError("Invalid path")

    response = client.get("/api/v1/fs/?path=/invalid")

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid path"}


def test_list_files_detailed_success(client, mock_service):
    mock_service.list_files_detailed.return_value = [
        {"name": "file1.txt", "is_dir": False},
        {"name": "dir1", "is_dir": True},
    ]

    response = client.post("/api/v1/fs/list", json={"path": "/tmp"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "file1.txt"
    mock_service.list_files_detailed.assert_called_once_with("/tmp")


def test_list_files_detailed_error(client, mock_service):
    mock_service.list_files_detailed.side_effect = ValueError("Invalid path")

    response = client.post("/api/v1/fs/list", json={"path": "/invalid"})

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid path"}
