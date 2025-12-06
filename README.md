# 🚦 Quality Gate Tool

> An immersive, 3D code quality analysis platform featuring a Matrix-themed interface and real-time reporting.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker&logoColor=white)](https://www.docker.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

## ✨ Overview

**Quality Gate Tool** transforms code analysis into an interactive experience. Instead of parsing boring text logs, explore your project's structure in a environment where modules are building blocks and quality issues are visualized in real-time.

Built with a modern modular architecture, it seamlessly integrates powerful static analysis tools for both Python and TypeScript ecosystems.

## 🚀 Features

- **🌐 File System Explorer**: Navigate your file system and select the project to analize.
- **⚡ Real-Time Analysis**: WebSocket-based architecture ensures immediate feedback as you code.
- **🕵️ Comprehensive Quality Checks**:
  - **Backend (Python)**: Ruff (Linting/Formatting), Pyright (Type Checking), Lizard (Complexity).
  - **Frontend (TypeScript)**: ESLint, TypeScript Compiler, Prettier.
- **🐳 Fully Dockerized**: Zero-configuration setup with Docker Compose.
- **🛡️ Robust Architecture**:
  - **Frontend**: Next.js 15 (App Router), Mantine UI, Zustand.
  - **Backend**: FastAPI, Clean Architecture (DDD), Poetry.
- **🔒 Security & Quality**: Pre-configured pre-commit hooks with Gitleaks and strict linting.

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Visualization**: Three.js, React Three Fiber, Drei
- **UI Library**: Mantine v7
- **Testing**: Vitest, Playwright

### Backend

- **Framework**: FastAPI
- **Language**: Python 3.12
- **Dependency Management**: Poetry
- **Analysis Tools**: Ruff, Pyright, Lizard, Bandit
- **Testing**: Pytest

## 🏁 Getting Started

### Prerequisites

- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/quality-gate-tool.git
   cd quality-gate-tool
   ```

2. **Start the application**

   ```bash
   docker compose up --build
   ```

3. **Access the dashboard**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/docs`

## 🧪 Development

### Project Structure

```
.
├── backend/            # FastAPI application (Clean Architecture)
│   ├── app/modules/    # Domain modules (Analysis, Filesystem, Project)
│   └── tests/          # Pytest suite
├── frontend/           # Next.js application
│   ├── src/components/ # React components (including 3D scenes)
│   └── e2e/            # Playwright tests
└── docker-compose.yml  # Orchestration
```

### Running Tests

**Backend:**

```bash
cd backend
poetry run pytest
```

**Frontend:**

```bash
cd frontend
npm run test        # Unit tests (Vitest)
npx playwright test # E2E tests
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
