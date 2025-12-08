from typing import Any, Dict, List

from ..domain.ports import FilesystemPort


class FilesystemService:
    def __init__(self, adapter: FilesystemPort):
        self.adapter = adapter

    async def list_files(self, path: str) -> List[str]:
        return await self.adapter.list_directory(path)

    async def list_files_detailed(self, path: str) -> Dict[str, Any]:
        items = await self.adapter.list_directory_details(path)
        return {"path": path, "directories": items}
