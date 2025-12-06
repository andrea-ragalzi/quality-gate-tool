import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.filesystem.application.services import FilesystemService
from app.modules.filesystem.infrastructure.adapters.local_adapter import (
    LocalFilesystemAdapter,
)
from app.modules.filesystem.infrastructure.web.router import get_filesystem_service


# Setup Dependency Injection for Test
@pytest.fixture
def client():
    fs_adapter = LocalFilesystemAdapter()
    fs_service = FilesystemService(fs_adapter)
    app.dependency_overrides[get_filesystem_service] = lambda: fs_service

    with TestClient(app) as c:
        yield c

    # Cleanup
    app.dependency_overrides = {}


def test_list_files_injection_attempt(client):
    """
    Security Test: Verify that malicious input is treated as a path
    and not executed (Command Injection Prevention).
    """
    # Simulate a command injection attempt in the path
    # The application should treat it as a path and fail (400) rather than executing it
    # Note: The endpoint is POST /list, not GET /
    response = client.post("/api/v1/fs/list", json={"path": ";rm -rf /"})

    # It should return 400 because the path likely doesn't exist
    # If it returns 500 or executes, that's bad.
    assert response.status_code == 400
    assert "not a valid directory" in response.json()["detail"]


def test_list_files_path_traversal_attempt(client):
    """
    Security Test: Verify that path traversal attempts are handled gracefully.
    (Note: Currently the app allows reading any file, but it should still return 400 for invalid ones)
    """
    # Note: The endpoint is POST /list, not GET /
    response = client.post("/api/v1/fs/list", json={"path": "/non/existent/../../path"})
    assert response.status_code == 400
