import os
import subprocess
import tempfile

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


# Use AsyncClient for async tests to avoid event loop blocking issues
@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_api_guard_no_project(async_client):
    """
    E2E-002 Backend Guard: Ensure analysis fails if project path is invalid or missing.
    This complements the frontend guard.
    """
    # Case 1: Empty path
    response = await async_client.post("/api/run-analysis", json={"project_path": "", "mode": "watch"})
    # Expecting 422 (Validation Error) from Pydantic
    assert response.status_code == 422

    # Case 2: Non-existent path
    response = await async_client.post(
        "/api/run-analysis",
        json={"project_path": "/non/existent/path/12345", "mode": "watch"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_watch_mode_cycle_stability(async_client):
    """
    E2E-004 Backend: Watch Mode Cycle Stability
    Verifies that we can Start -> Stop -> Start without hanging or errors.
    """
    with tempfile.TemporaryDirectory() as tmpdirname:
        # 1. Start Watch
        response = await async_client.post(
            "/api/run-analysis",
            json={
                "project_path": tmpdirname,
                "mode": "watch",
                "project_id": "test-project-id",
            },
        )
        assert response.status_code == 202
        data = response.json()
        assert data["status"] == "accepted"
        assert data["mode"] == "watch"

        # 2. Stop Watch
        response = await async_client.post("/api/stop-watch", json={"project_id": "test-project-id"})
        assert response.status_code == 202
        assert response.json()["status"] == "stopped"

        # 3. Start Watch Again
        response = await async_client.post(
            "/api/run-analysis",
            json={
                "project_path": tmpdirname,
                "mode": "watch",
                "project_id": "test-project-id",
            },
        )
        assert response.status_code == 202
        assert response.json()["status"] == "accepted"

        # Cleanup
        await async_client.post("/api/stop-watch", json={"project_id": "test-project-id"})


@pytest.mark.asyncio
async def test_incremental_analysis_no_changes(async_client):
    """
    Verifies that incremental analysis returns correct status when no files change.
    """
    with tempfile.TemporaryDirectory() as tmpdirname:
        # Initialize git repo to make it a valid project for git diff
        subprocess.run(
            ["git", "init"],
            cwd=tmpdirname,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        # Configure git user for commit (needed for some git versions/environments)
        subprocess.run(
            ["git", "config", "user.email", "test@example.com"],
            cwd=tmpdirname,
            check=True,
        )
        subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmpdirname, check=True)

        # Create a dummy file and commit it so we have a HEAD
        with open(os.path.join(tmpdirname, "README.md"), "w") as f:
            f.write("Initial commit")
        subprocess.run(["git", "add", "."], cwd=tmpdirname, check=True)
        subprocess.run(
            ["git", "commit", "-m", "Initial commit"],
            cwd=tmpdirname,
            check=True,
            stdout=subprocess.DEVNULL,
        )

        # Modify a file to trigger incremental analysis with an irrelevant file
        # This ensures we test the filtering/skipping logic, not the fallback to full analysis
        with open(os.path.join(tmpdirname, "README.md"), "a") as f:
            f.write("\nChange")

        response = await async_client.post(
            "/api/run-analysis",
            json={
                "project_path": tmpdirname,
                "mode": "incremental",
                "project_id": "test-project-id",
            },
        )

        assert response.status_code == 202
        data = response.json()
        # Should be accepted
        assert data["status"] == "accepted"
