from unittest.mock import AsyncMock

import pytest

from app.modules.filesystem.application.services import FilesystemService
from app.modules.filesystem.domain.ports import FilesystemPort


@pytest.fixture
def mock_adapter():
    return AsyncMock(spec=FilesystemPort)


@pytest.fixture
def service(mock_adapter):
    return FilesystemService(mock_adapter)


@pytest.mark.asyncio
async def test_list_files(service, mock_adapter):
    # Arrange
    mock_adapter.list_directory.return_value = ["file1", "file2"]

    # Act
    result = await service.list_files("/some/path")

    # Assert
    assert result == ["file1", "file2"]
    mock_adapter.list_directory.assert_called_once_with("/some/path")
