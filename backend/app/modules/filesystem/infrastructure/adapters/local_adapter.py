import os
from pathlib import Path
from typing import Any

from ...domain.ports import FilesystemPort


class LocalFilesystemAdapter(FilesystemPort):
    async def list_directory(self, path: str) -> list[str]:
        p = Path(path)
        if not p.exists() or not p.is_dir():
            raise ValueError(f"Path {path} is not a valid directory")
        return [entry.name for entry in os.scandir(path)]

    async def list_directory_details(self, path: str) -> list[dict[str, Any]]:
        p = Path(path)
        if not p.exists() or not p.is_dir():
            raise ValueError(f"Path {path} is not a valid directory")

        results: list[dict[str, Any]] = []
        for entry in os.scandir(path):
            try:
                stat = entry.stat()
                results.append(
                    {
                        "name": entry.name,
                        "path": entry.path,
                        "is_dir": entry.is_dir(),
                        "size": stat.st_size,
                        "modified": stat.st_mtime,
                    }
                )
            except OSError:
                # Fallback if stat fails, still return the entry so it's visible
                results.append(
                    {
                        "name": entry.name,
                        "path": entry.path,
                        "is_dir": entry.is_dir(),
                        "size": 0,
                        "modified": 0,
                    }
                )
                continue

        # Sort alphabetically by name
        results.sort(key=lambda x: x["name"].lower())
        return results

    async def read_file_content(self, path: str) -> str:
        p = Path(path)
        if not p.exists() or not p.is_file():
            raise ValueError(f"Path {path} is not a valid file")
        return p.read_text(encoding="utf-8")

    async def path_exists(self, path: str) -> bool:
        return Path(path).exists()
