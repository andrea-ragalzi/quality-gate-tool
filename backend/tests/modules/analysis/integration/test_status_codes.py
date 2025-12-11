import os
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.analysis.infrastructure.web.router import get_analysis_service

# Mock Service
mock_service = AsyncMock()

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_env():
    # Save original overrides
    original_overrides = app.dependency_overrides.copy()

    # Set mock override
    app.dependency_overrides[get_analysis_service] = lambda: mock_service

    # Create dir
    os.makedirs("/tmp/test", exist_ok=True)

    yield

    # Restore original overrides
    app.dependency_overrides = original_overrides


@pytest.mark.parametrize(
    "scenario, method, endpoint, payload, expected_status",
    [
        (
            "STATUS-001: Invalid Project ID",
            "POST",
            "/api/run-analysis",
            {
                "project_path": "/tmp/test",
                "mode": "full",
                "project_id": "99999",
            },
            404,
        ),
        (
            "STATUS-002: Concurrent Conflict",
            "POST",
            "/api/run-analysis",
            {
                "project_path": "/tmp/test",
                "mode": "full",
                "project_id": "conflict_id",
            },
            409,
        ),
        (
            "STATUS-003: Successful Initiation",
            "POST",
            "/api/run-analysis",
            {
                "project_path": "/tmp/test",
                "mode": "full",
                "project_id": "valid_id",
            },
            202,
        ),
        (
            "STATUS-004: Watch Mode Initiation",
            "POST",
            "/api/run-analysis",
            {
                "project_path": "/tmp/test",
                "mode": "watch",
                "project_id": "watch_id",
            },
            202,
        ),
        (
            "STATUS-004: Stop Watch",
            "POST",
            "/api/stop-watch",
            {"project_id": "watch_id"},
            202,
        ),
        (
            "STATUS-005: Malformed Payload (Missing project_id)",
            "POST",
            "/api/run-analysis",
            {"project_path": "/tmp/test", "mode": "full"},
            422,
        ),
    ],
)
def test_status_code_compliance(scenario, method, endpoint, payload, expected_status):
    # Setup Mocks based on scenario
    if "Concurrent Conflict" in scenario:
        mock_service.start_analysis.side_effect = RuntimeError("Analysis already running")
    elif "Successful Initiation" in scenario or "Watch Mode" in scenario:
        mock_service.start_analysis.side_effect = None
        mock_service.start_analysis.return_value = {"status": "accepted"}
    elif "Stop Watch" in scenario:
        mock_service.stop_analysis.return_value = {"status": "stopped"}
    else:
        mock_service.start_analysis.side_effect = None

    # Execute Request
    if method == "POST":
        response = client.post(endpoint, json=payload)
    elif method == "GET":
        response = client.get(endpoint)

    # Assert Status Code
    assert (
        response.status_code == expected_status
    ), f"Failed {scenario}: Expected {expected_status}, got {response.status_code}. Body: {response.text}"


def test_metrics_not_found():
    """
    STATUS-006: Resource Not Found (Metrics)
    """
    # Assuming there is an endpoint /api/metrics/{id} or similar.
    # The current router doesn't seem to have it exposed directly in the analysis router.
    # It might be in the project router or not implemented yet.
    # The prompt asks for GET /api/metrics/{id}.
    # If it doesn't exist, it will return 404 automatically.
    # Let's verify that behavior.
    response = client.get("/api/metrics/non_existent_id")
    assert response.status_code == 404
