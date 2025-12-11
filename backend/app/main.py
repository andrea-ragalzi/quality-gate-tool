import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.analysis.application.services import AnalysisOrchestratorService
from app.modules.analysis.infrastructure.adapters.websocket_notifier import (
    WebSocketNotifier,
)
from app.modules.analysis.infrastructure.web.router import (
    get_analysis_service,
    get_notifier,
)

# Analysis Module Imports
from app.modules.analysis.infrastructure.web.router import router as analysis_router
from app.modules.filesystem.application.services import FilesystemService
from app.modules.filesystem.infrastructure.adapters.local_adapter import (
    LocalFilesystemAdapter,
)
from app.modules.filesystem.infrastructure.web.router import get_filesystem_service

# Filesystem Module Imports
from app.modules.filesystem.infrastructure.web.router import router as filesystem_router
from app.modules.project.application.services import ProjectService
from app.modules.project.infrastructure.adapters.json_repository import (
    ProjectJSONRepository,
)
from app.modules.project.infrastructure.web.router import get_project_service

# Project Module Imports
from app.modules.project.infrastructure.web.router import router as project_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Quality Gate Tool (Modular Monolith)")


# Force reload trigger 2
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency Injection Setup ---

# Project Module
project_repo = ProjectJSONRepository()
project_service_instance = ProjectService(project_repo)
app.dependency_overrides[get_project_service] = lambda: project_service_instance

# Filesystem Module
fs_adapter = LocalFilesystemAdapter()
fs_service_instance = FilesystemService(fs_adapter)
app.dependency_overrides[get_filesystem_service] = lambda: fs_service_instance

# Analysis Module
ws_notifier_instance = WebSocketNotifier()
analysis_service_instance = AnalysisOrchestratorService(ws_notifier_instance)
app.dependency_overrides[get_notifier] = lambda: ws_notifier_instance
app.dependency_overrides[get_analysis_service] = lambda: analysis_service_instance

# --- Include Routers ---
app.include_router(project_router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(filesystem_router, prefix="/api/v1/fs", tags=["Filesystem"])
app.include_router(analysis_router, tags=["Analysis"])


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Quality Gate Tool API is running"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
