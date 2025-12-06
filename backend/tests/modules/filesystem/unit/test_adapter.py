import pytest

from app.modules.filesystem.infrastructure.adapters.local_adapter import (
    LocalFilesystemAdapter,
)


@pytest.fixture
def adapter():
    return LocalFilesystemAdapter()


@pytest.mark.asyncio
async def test_list_directory_success(adapter, tmp_path):
    # Arrange
    d = tmp_path / "subdir"
    d.mkdir()
    (d / "file1.txt").write_text("content")
    (d / "file2.txt").write_text("content")

    # Act
    files = await adapter.list_directory(str(d))

    # Assert
    assert len(files) == 2
    assert "file1.txt" in files
    assert "file2.txt" in files


@pytest.mark.asyncio
async def test_list_directory_not_found(adapter):
    with pytest.raises(ValueError, match="not a valid directory"):
        await adapter.list_directory("/non/existent/path")


@pytest.mark.asyncio
async def test_list_directory_is_file(adapter, tmp_path):
    f = tmp_path / "file.txt"
    f.write_text("content")

    with pytest.raises(ValueError, match="not a valid directory"):
        await adapter.list_directory(str(f))


@pytest.mark.asyncio
async def test_read_file_content_success(adapter, tmp_path):
    f = tmp_path / "test.txt"
    f.write_text("Hello World")

    content = await adapter.read_file_content(str(f))
    assert content == "Hello World"


@pytest.mark.asyncio
async def test_read_file_content_not_found(adapter):
    with pytest.raises(ValueError, match="not a valid file"):
        await adapter.read_file_content("/non/existent/file.txt")


@pytest.mark.asyncio
async def test_path_exists(adapter, tmp_path):
    f = tmp_path / "exists.txt"
    f.touch()

    assert await adapter.path_exists(str(f)) is True
    assert await adapter.path_exists(str(tmp_path / "non_existent")) is False


@pytest.mark.asyncio
async def test_list_directory_details_success(adapter, tmp_path):
    # Arrange
    d = tmp_path / "details_dir"
    d.mkdir()
    f1 = d / "file1.txt"
    f1.write_text("content1")
    f2 = d / "file2.txt"
    f2.write_text("content2")
    sub = d / "subdir"
    sub.mkdir()

    # Act
    details = await adapter.list_directory_details(str(d))

    # Assert
    assert len(details) == 3
    names = {item["name"] for item in details}
    assert "file1.txt" in names
    assert "file2.txt" in names
    assert "subdir" in names

    for item in details:
        assert "path" in item
        assert "is_dir" in item
        assert "size" in item
        assert "modified" in item
        if item["name"] == "subdir":
            assert item["is_dir"] is True
        else:
            assert item["is_dir"] is False


@pytest.mark.asyncio
async def test_list_directory_details_not_found(adapter):
    with pytest.raises(ValueError, match="not a valid directory"):
        await adapter.list_directory_details("/non/existent/path")
