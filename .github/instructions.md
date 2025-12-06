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
- **Styling:** SCSS (Matrix theme).
- **State Management:** React Hooks + Context.
- **Communication:** REST API + WebSockets (for real-time analysis logs).
- **Visualization:** 3D FileSystem visualization (likely Three.js/React Three Fiber).

### Infrastructure

- **Docker:** The entire stack runs via `docker-compose.yml`.
- **Networking:**
  - Frontend -> Backend (Server-side): `http://backend:8000`
  - Frontend -> Backend (Client-side): `http://localhost:8000`

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
  ```
- **Frontend:**
  ```bash
  cd frontend
  npm run test
  ```

### Debugging

- **Logs:** Use `docker logs -f quality-gate-backend` or `quality-gate-frontend`.
- **WebSockets:** If analysis hangs or fails silently, check the backend logs for `AttributeError` in `ScopedAnalysisNotifier` or WebSocket disconnects.
- **File Watching:** The backend uses `watchfiles`. Ensure the volume mount for the workspace is correct in `docker-compose.yml`.

## 5. Recent Fixes (Context)

- **Fixed `ScopedAnalysisNotifier`:** Added missing methods (`send_init`, `send_error`, `send_log`, `send_stream`, `send_end`) to support the `AnalysisNotifierPort` interface fully.
- **Fixed `/api/stop-watch`:** Added the missing endpoint to allow the frontend to stop the file watcher cleanly.

---

_Read these instructions before making architectural changes._
