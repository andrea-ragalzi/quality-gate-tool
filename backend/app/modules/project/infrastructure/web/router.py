from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ...application.services import ProjectService
from ...domain.entities import Project

router = APIRouter()


class CreateProjectRequest(BaseModel):
    name: str
    path: str


# Dependency Injection Placeholder (will be overridden in main.py)
async def get_project_service() -> ProjectService:
    raise NotImplementedError


@router.post("/", response_model=Project)
async def create_project(
    request: CreateProjectRequest,
    service: ProjectService = Depends(get_project_service),
):
    return await service.create_project(request.name, request.path)


@router.get("/", response_model=List[Project])
async def list_projects(service: ProjectService = Depends(get_project_service)):
    return await service.list_projects()
