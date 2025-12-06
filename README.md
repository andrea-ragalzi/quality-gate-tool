# 🚦 Quality Gate Tool

> Standalone quality analysis tool for Python/TypeScript full-stack projects with live HTML reports

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Shell Script](https://img.shields.io/badge/Shell_Script-4EAA25?logo=gnu-bash&logoColor=white)](https://www.gnu.org/software/bash/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## ✨ Features

- **🎯 Automatic Project Detection**: Detects frontend (Node.js/TypeScript) and backend (Python) automatically
- **⚡ Incremental Analysis (Default)**: Analyzes only git-changed files for 10-100x faster execution
- **🔄 Live HTML Reports**: Real-time browser updates with Matrix-style terminal interface
- **🚀 Parallel Execution**: Frontend and backend checks run simultaneously
- **📊 Comprehensive Coverage**: 8 different quality tools covering style, types, linting, and complexity
- **🎨 Zero Configuration**: Works out-of-the-box with sensible defaults

## 🛠️ What It Analyzes

### Frontend (TypeScript/JavaScript)

- **Prettier**: Code formatting consistency
- **TypeScript**: Type checking and compilation errors
- **ESLint**: Code quality and best practices
- **Complexity**: Cyclomatic complexity violations

### Backend (Python)

- **Black**: Code formatting consistency
- **MyPy**: Static type checking with fine-grained caching
- **Pylint**: Code quality, errors, and warnings
- **Lizard**: Cyclomatic complexity analysis

## 📋 Prerequisites

### Frontend Tools

```bash
npm install --save-dev prettier typescript eslint
```

### Backend Tools

```bash
pip install black mypy pylint lizard
```

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/quality-gate-tool.git
cd quality-gate-tool

# Make script executable
chmod +x quality-gate-universal.sh
```

### Basic Usage

```bash
# Run incremental analysis (default - only changed files)
./quality-gate-universal.sh /path/to/your/project

# Run full analysis
./quality-gate-universal.sh /path/to/your/project --full

# Run in current directory
./quality-gate-universal.sh
```

### Expected Project Structure

```
your-project/
├── frontend/
│   ├── package.json          # Required for frontend detection
│   ├── tsconfig.json          # Optional: enables TypeScript checks
│   └── src/
└── backend/
    ├── pyproject.toml         # Or requirements.txt
    ├── .venv/                 # Virtual environment
    └── app/                   # Or src/
```

## ⚡ Incremental Mode (Default)

By default, the tool runs in **incremental mode**, analyzing only files changed since the last git commit:

- **10-100x faster** than full analysis
- Uses `git diff --name-only HEAD` to detect changes
- Perfect for pre-commit hooks and CI pipelines
- Automatically falls back to full analysis if not a git repository

### Performance Comparison

| Tool   | Full Analysis | Incremental (10 files) | Speedup |
| ------ | ------------- | ---------------------- | ------- |
| MyPy   | 87 seconds    | 1 second               | 87x     |
| Pylint | 73 seconds    | 2 seconds              | 36x     |
| ESLint | 15 seconds    | 0.5 seconds            | 30x     |

### Switching Modes

```bash
# Incremental mode (default)
./quality-gate-universal.sh

# Full analysis
./quality-gate-universal.sh --full
./quality-gate-universal.sh -f
```

## 📊 Live HTML Reports

The tool generates a **live HTML report** that updates in real-time:

- **Auto-refreshes** every 2 seconds during analysis
- **Matrix-style terminal theme** for that hacker aesthetic
- **Detailed statistics** per tool (errors, warnings, issues)
- **Expandable details** with truncated output for readability
- **HTTP server** stays active until you press ENTER

Reports are saved to: `<script-directory>/quality-gate-reports/`

### How It Works

1. Script starts HTTP server on port 8001
2. Browser opens automatically at `http://localhost:8001/quality-gate-index.html`
3. Report updates live as checks complete
4. **Press ENTER** in terminal when you're done to stop the server

### Why Reports Are Outside Your Project

Reports are intentionally saved **outside** the analyzed project directory to:

- ✅ Prevent polluting your git repository
- ✅ Avoid HTTP server security issues (serving source code)
- ✅ Enable analysis of multiple projects with a single tool installation

## 🔧 Configuration

### Tool-Specific Configs

The script respects your existing configuration files:

#### Python

- `.pylintrc` - Pylint configuration
- `pyproject.toml` or `mypy.ini` - MyPy configuration

#### TypeScript/JavaScript

- `.prettierrc` - Prettier configuration
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.*` - ESLint configuration

### Excluding Directories

The script automatically excludes common directories:

- `examples/`, `scripts/` (Python)
- `node_modules/`, `.venv/`, `venv/`, `__pycache__/`
- `chroma_db/`, `htmlcov/`, `logs/`

## 🚨 Exit Codes

- `0` - **PASSED**: All checks passed
- `1` - **FAILED**: One or more checks failed (errors OR warnings)

Perfect for CI/CD integration:

```bash
./quality-gate-universal.sh || exit 1
```

## 🐛 Troubleshooting

### Pylint Must Load Virtual Environment

**Issue**: Pylint takes 30-40 seconds even for incremental runs

**Why**: Pylint must load your virtual environment to resolve imports correctly. This is unavoidable but ensures accurate analysis.

**Solution**: Use incremental mode (default) which disables refactoring/convention checks for faster execution.

### MyPy Cache Issues

**Issue**: MyPy reports "error: Duplicate module named..."

**Solution**: Clear the cache and rebuild:

```bash
rm -rf /tmp/mypy_cache
./quality-gate-universal.sh
```

### HTTP Server Port Already in Use

**Issue**: "Address already in use" error on port 8001

**Solution**: The tool automatically manages server lifecycle, but if needed:

```bash
# Find and kill stale server
lsof -ti:8001 | xargs kill -9
rm -f /tmp/.quality_gate_server_pid /tmp/.quality_gate_browser_lock
```

### No Frontend/Backend Detected

**Issue**: "No frontend or backend detected" error

**Cause**: Missing required marker files in expected locations

**Solution**:

1. Frontend requires: `frontend/package.json`
2. Backend requires ONE of:
   - `backend/pyproject.toml`
   - `backend/requirements.txt`
   - `backend/.venv/` directory

## 🏗️ Architecture

### Script Structure

```
quality-gate-universal.sh (650 lines → modular)
├── Configuration (colors, thresholds, paths)
├── Utility Functions (logging, cleanup, locks)
├── Argument Parsing (incremental/full mode)
├── Project Detection (frontend/backend auto-detect)
├── Git Changed Files (incremental mode logic)
├── Report Management (HTML generation, HTTP server)
├── Frontend Checks (Prettier, TS, ESLint, Complexity)
├── Backend Checks (Black, MyPy, Pylint, Lizard)
└── Main Execution (parallel runs, status aggregation)
```

### Key Optimizations

1. **MyPy Caching**: Fine-grained cache with skip-mtime-checks (87s → 1s)
2. **Pylint Parallelization**: `--jobs=0` uses all CPU cores
3. **Lizard Multi-threading**: `-j 8` for parallel file analysis
4. **Incremental Mode**: Only analyzes git-changed files
5. **Parallel Execution**: Frontend and backend checks run simultaneously

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
git clone https://github.com/yourusername/quality-gate-tool.git
cd quality-gate-tool

# Test on your project
./quality-gate-universal.sh /path/to/test/project

# Run full analysis
./quality-gate-universal.sh /path/to/test/project --full
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by various CI/CD quality gate implementations
- Matrix theme inspired by the classic terminal aesthetic
- Built with ❤️ for developers who care about code quality

---

**Made with ☕ by Andrea** | [Report Issues](https://github.com/yourusername/quality-gate-tool/issues)
