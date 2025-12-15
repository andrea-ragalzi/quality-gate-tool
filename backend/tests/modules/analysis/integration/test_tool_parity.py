import subprocess
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from app.modules.analysis.application.engine.modules import (
    ESLintModule,
    LizardModule,
    PyrightModule,
    RuffModule,
    TypeScriptModule,
)

# Determine workspace root dynamically
# This file is in backend/tests/modules/analysis/integration/
# We want to go up to quality-gate-tool/
CURRENT_FILE = Path(__file__).resolve()
BACKEND_ROOT = CURRENT_FILE.parents[4]  # tests/modules/analysis/integration -> backend
WORKSPACE_ROOT = BACKEND_ROOT.parent


@pytest.fixture
def mock_notifier():
    return MagicMock()


def run_module_check(module_class, name, path, mock_notifier):
    """Helper to run a module check and verify output parsing"""
    print(f"\n--- Testing {name} in {path} ---")

    if not path.exists():
        pytest.skip(f"Path {path} does not exist")

    module = module_class("test_id", name, str(path), mock_notifier)
    cmd = module.get_command()

    print(f"Command: {' '.join(cmd)}")

    # Run command
    # We use shell=False and pass the list
    try:
        result = subprocess.run(
            cmd,
            cwd=str(path),
            capture_output=True,
            text=True,
            check=False,  # Don't raise on non-zero exit code
        )
    except FileNotFoundError as e:
        pytest.fail(f"Command not found: {e}")
        raise  # Unreachable, but helps type checker understand control flow

    print(f"Exit Code: {result.returncode}")
    # print(f"Stdout Preview: {result.stdout[:200]}...")
    # print(f"Stderr Preview: {result.stderr[:200]}...")

    # Test parsing
    summary = module.get_summary(result.stdout, result.stderr, result.returncode)
    print(f"Generated Summary: {summary}")

    # Basic assertions
    assert summary is not None
    assert isinstance(summary, str)
    assert any(icon in summary for icon in ["✅", "❌", "⚠️"])

    return result, summary


@pytest.mark.integration
def test_typescript_parity(mock_notifier):
    frontend_path = WORKSPACE_ROOT / "frontend"
    run_module_check(TypeScriptModule, "TypeScript", frontend_path, mock_notifier)


@pytest.mark.integration
def test_eslint_parity(mock_notifier):
    frontend_path = WORKSPACE_ROOT / "frontend"
    run_module_check(ESLintModule, "ESLint", frontend_path, mock_notifier)


@pytest.mark.integration
def test_ruff_parity(mock_notifier):
    backend_path = WORKSPACE_ROOT / "backend"
    run_module_check(RuffModule, "Ruff", backend_path, mock_notifier)


@pytest.mark.integration
def test_pyright_parity(mock_notifier):
    backend_path = WORKSPACE_ROOT / "backend"
    run_module_check(PyrightModule, "Pyright", backend_path, mock_notifier)


@pytest.mark.integration
def test_lizard_parity(mock_notifier):
    backend_path = WORKSPACE_ROOT / "backend"
    run_module_check(LizardModule, "Lizard", backend_path, mock_notifier)
