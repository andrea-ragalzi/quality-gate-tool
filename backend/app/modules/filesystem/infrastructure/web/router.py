from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ...application.services import FilesystemService

router = APIRouter()


class ListFilesRequest(BaseModel):
    path: str


# Dependency Injection Placeholder
async def get_filesystem_service() -> FilesystemService:
    raise NotImplementedError


@router.post("/list")
async def list_files_detailed(
    request: ListFilesRequest,
    service: FilesystemService = Depends(get_filesystem_service),
) -> Dict[str, Any]:
    try:
        return await service.list_files_detailed(request.path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[str])
async def list_files(path: str, service: FilesystemService = Depends(get_filesystem_service)):
    try:
        return await service.list_files(path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
