from typing import Any

from ..domain.ports import FilesystemPort


class FilesystemService:
    def __init__(self, adapter: FilesystemPort) -> None:
        self.adapter = adapter

    async def list_files(self, path: str) -> list[str]:
        return await self.adapter.list_directory(path)

    async def list_files_detailed(self, path: str) -> dict[str, Any]:
        items = await self.adapter.list_directory_details(path)
        return {"path": path, "directories": items}
