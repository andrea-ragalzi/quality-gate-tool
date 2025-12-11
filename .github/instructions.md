# Quality Gate Tool - AI Developer Instructions

## 1. Project Overview

This is a **Quality Gate Tool** designed to analyze codebases, enforce quality standards, and visualize the results in a 3D environment (Matrix-themed). It operates as a **Modular Monolith**.

## 2. Architecture & Tech Stack

### Backend (`/backend`)

- **Framework:** FastAPI (Python).
- **Architecture:** Modular Monolith with **Hexagonal Architecture** (Ports & Adapters).
- **Modules:**
  - `analysis`: Core logic for running tools (Ruff, ESLint, etc.) and streaming results.
  - `filesystem`: Handles file operations and watching.
  - `project`: Manages project configurations.
- **Layer Structure (per module):**
  - `domain/`: Pure business logic, interfaces (Ports), entities. **No external dependencies.**
  - `application/`: Use cases, services, orchestrators. Depends on `domain`.
  - `infrastructure/`: Web adapters (FastAPI routers), implementations (Adapters), DB. Depends on `application` and `domain`.

### Frontend (`/frontend`)

- **Framework:** Next.js (React, TypeScript).
- **UI Library:** Mantine UI (with custom Matrix theme).
- **Styling:** SCSS (Matrix theme), CSS Modules.
- **State Management:** React Hooks + Context.
- **Communication:** REST API + WebSockets (for real-time analysis logs).
- **Visualization:** 3D FileSystem visualization (Three.js / React Three Fiber).

### Infrastructure

- **Docker:** The entire stack runs via `docker-compose.yml`.
- **Networking:**
  - Frontend -> Backend (Server-side): `http://backend:8000`
  - Frontend -> Backend (Client-side): `http://localhost:8000`
- **Configuration:**
  - `PROJECTS_ROOT`: Environment variable in `docker-compose.yml` defining the root path for analysis (mapped to host).

## 3. Development Guidelines

### Backend Rules

1.  **Respect Boundaries:** Do not import `infrastructure` code into `domain` or `application` layers.
2.  **Dependency Injection:** Use FastAPI's `Depends` for injecting services and adapters.
3.  **Analysis Modules:**
    - New tools must inherit from `AnalysisModule`.
    - Output must be streamed via `AnalysisNotifierPort`.
    - **Critical:** Ensure `ScopedAnalysisNotifier` implements all methods of `AnalysisNotifierPort` to avoid runtime crashes during WebSocket streaming.

### Frontend Rules

1.  **Theme:** Maintain the "Matrix" aesthetic (green/black, terminal fonts).
2.  **WebSockets:** Handle connection states (Connecting, Open, Closed, Error) gracefully.
3.  **Components:** Keep components small and focused. Use `features/` for domain-specific logic.

### Code Quality & Standards

1.  **Pre-commit Hooks:** The project uses `pre-commit` to enforce code quality.
    - Run `pre-commit run` before committing.
    - Hooks include: `ruff` (linting/formatting), `prettier`, and trailing whitespace checks.
2.  **Python Typing:** Strict type annotations are enforced by `ruff` (ANN rules).
    - All functions, methods, and `__init__` constructors **must** have explicit return type annotations (e.g., `-> None`).
3.  **Complexity:** `lizard` is used to check cyclomatic complexity (CCN).
    - Max CCN allowed: 15.

## 4. Common Tasks & Troubleshooting

### Running the Project

```bash
docker-compose up --build
```

### Running Tests

- **Backend:**
  ```bash
  cd backend
  pytest
  # Check complexity
  lizard . -C 15
  ```
- **Frontend:**
  ```bash
  cd frontend
  npm run test        # Unit tests (Vitest)
  npx playwright test # E2E tests
  ```

### Debugging

- **Logs:** Use `docker logs -f quality-gate-backend` or `quality-gate-frontend`.
- **WebSockets:** If analysis hangs or fails silently, check the backend logs for `AttributeError` in `ScopedAnalysisNotifier` or WebSocket disconnects.
- **File Watching:** The backend uses `watchfiles`. Ensure the volume mount for the workspace is correct in `docker-compose.yml`.

## 5. Recent Fixes (Context)

- **Pre-commit & Linting:** Resolved strict `ruff` failures by adding explicit return types (`-> None`) across the backend (Ports, Adapters, Orchestrators).
- **Build Artifacts:** Added `*.tsbuildinfo` to `.gitignore` to prevent `PermissionError` in pre-commit hooks.
- **Fixed `ScopedAnalysisNotifier`:** Added missing methods (`send_init`, `send_error`, `send_log`, `send_stream`, `send_end`) to support the `AnalysisNotifierPort` interface fully.
- **Fixed `/api/stop-watch`:** Added the missing endpoint to allow the frontend to stop the file watcher cleanly.

---

_Read these instructions before making architectural changes._
