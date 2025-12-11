"""
Quality Gate Analysis Modules - 6 Modules Specification
Modules: F_TypeScript, F_ESLint, F_Complexity, B_Ruff, B_Pyright, B_Lizard
"""

import json
import logging
import re
from pathlib import Path

from .base_module import AnalysisModule

logger = logging.getLogger(__name__)


# ============================================================================
# ANALYSIS MODULES
# ============================================================================


class TypeScriptModule(AnalysisModule):
    """F_TypeScript: TypeScript Type Checking"""

    def get_command(self, files: list[str] | None = None) -> list[str]:
        # Filter for incremental mode
        if files is not None:
            ts_files = [f for f in files if f.endswith((".ts", ".tsx", ".js", ".jsx"))]
            logger.info(f"[TypeScriptModule] Filtering files: {files} -> {ts_files}")
            if not ts_files:
                return []

        # Run TypeScript compiler in check mode
        # Use env to increase memory limit for Node.js to prevent OOM
        cmd = [
            "env",
            "NODE_OPTIONS=--max-old-space-size=4096",
            "npx",
            "tsc",
            "--noEmit",
            "--pretty",
            "false",
        ]

        # Agnostic check: if tsconfig.json is not in root, check immediate subdirectories
        if not (self.project_path / "tsconfig.json").exists():
            found = False
            # Find first subdirectory containing tsconfig.json
            for path in self.project_path.iterdir():
                if path.is_dir() and (path / "tsconfig.json").exists():
                    cmd.extend(["-p", path.name])
                    found = True
                    break

            if not found:
                self.config_warning = "tsconfig.json not found. Using default configuration."

        return cmd

    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        if exit_code == 0:
            return "✅ No type errors found"

        # Count error lines
        error_lines = [line for line in stdout.split("\n") if "error TS" in line]
        error_count = len(error_lines)

        if error_count > 0:
            return f"❌ {error_count} type error(s) found"
        return "❌ Type checking failed"


class ESLintModule(AnalysisModule):
    """F_ESLint: Linting and Quality Check"""

    def get_command(self, files: list[str] | None = None) -> list[str]:
        # 1. Filter files first (Incremental Mode)
        cmd_args = []
        if files is not None:
            js_ts_files = [f for f in files if f.endswith((".js", ".ts", ".tsx", ".jsx"))]
            logger.info(f"[ESLintModule] Filtering files: {files} -> {js_ts_files}")
            if not js_ts_files:
                return []  # SKIPPED
            cmd_args.extend(js_ts_files)

        # 2. Check for configuration file
        config_files = [
            ".eslintrc",
            ".eslintrc.js",
            ".eslintrc.cjs",
            ".eslintrc.yaml",
            ".eslintrc.yml",
            ".eslintrc.json",
            "eslint.config.js",
            "eslint.config.mjs",
            "eslint.config.cjs",
        ]

        has_config = False
        config_dir = self.project_path  # Default to root

        # Check root
        for cfg in config_files:
            if (self.project_path / cfg).exists():
                has_config = True
                break

        if not has_config and (self.project_path / "package.json").exists():
            try:
                with open(self.project_path / "package.json") as f:
                    pkg_data = json.load(f)
                    if "eslintConfig" in pkg_data:
                        has_config = True
            except Exception:
                pass

        # Check subdirectories if not found in root (Monorepo support)
        if not has_config:
            try:
                for path in self.project_path.iterdir():
                    if path.is_dir():
                        # Check for config files in subdir
                        for cfg in config_files:
                            if (path / cfg).exists():
                                has_config = True
                                config_dir = path
                                break

                        # Check package.json in subdir
                        if not has_config and (path / "package.json").exists():
                            try:
                                with open(path / "package.json") as f:
                                    pkg_data = json.load(f)
                                    if "eslintConfig" in pkg_data:
                                        has_config = True
                                        config_dir = path
                            except Exception:
                                pass

                        if has_config:
                            break
            except Exception as e:
                logger.warning(f"Failed to scan subdirectories for ESLint config: {e}")

        if not has_config:
            self.config_warning = "No ESLint configuration found. Skipping analysis."
            return ["node", "-e", ""]

        # 3. Build command
        cmd = []

        # Handle Monorepo/Subdirectory Config
        if config_dir != self.project_path:
            rel_dir = config_dir.name
            # Use env -C to change directory for the command
            cmd.extend(["env", "-C", rel_dir])

            # Adjust files for subdirectory context
            if files is not None:
                rel_files = []
                for f in cmd_args:
                    if f.startswith(f"{rel_dir}/"):
                        rel_files.append(f[len(rel_dir) + 1 :])

                if not rel_files:
                    logger.info(f"[ESLintModule] No files match config directory {rel_dir}. Skipping.")
                    return []
                cmd_args = rel_files

        # Docker/Global Environment Detection
        # If running in Docker (standard path exists), use global eslint and plugins
        global_node_modules = Path("/usr/local/lib/node_modules")
        if global_node_modules.exists():
            cmd.extend(
                [
                    "eslint",
                    "--resolve-plugins-relative-to",
                    str(global_node_modules),
                ]
            )
        else:
            # Local Environment: Use npx to find local eslint
            cmd.extend(["npx", "eslint"])

        cmd.extend(
            [
                "--format",
                "json",
                "--no-error-on-unmatched-pattern",
                "--ext",
                ".js,.jsx,.ts,.tsx",
            ]
        )

        # Determine target directory based on config location
        target_dir = "src/"

        # If config is in root, look for src in root or subdirs (legacy behavior)
        if config_dir == self.project_path:
            if not (self.project_path / "src").exists():
                found = False
                for path in self.project_path.iterdir():
                    if path.is_dir() and (path / "src").exists():
                        target_dir = f"{path.name}/src/"
                        found = True
                        break

                if not found:
                    self.config_warning = "Source directory 'src' not found. Analyzing root directory."
                    target_dir = "."
        else:
            # If config is in a subdirectory, we are already "inside" it via env -C
            if (config_dir / "src").exists():
                target_dir = "src"
            else:
                target_dir = "."
                self.config_warning = f"Source directory 'src' not found in {config_dir.name}. Analyzing module root."

        if files is not None:
            cmd.extend(cmd_args)
        else:
            cmd.append(target_dir)

        return cmd

    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        if self.config_warning and "No ESLint configuration found" in self.config_warning:
            return "⚠️ Skipped (No Config)"

        try:
            if stdout.strip():
                results = json.loads(stdout)

                error_count = 0
                warning_count = 0

                for result in results:
                    error_count += result.get("errorCount", 0)
                    warning_count += result.get("warningCount", 0)

                if error_count == 0 and warning_count == 0:
                    return "✅ No linting issues"
                elif error_count == 0:
                    return f"⚠️ {warning_count} warning(s)"
                else:
                    return f"❌ {error_count} error(s), {warning_count} warning(s)"
        except (json.JSONDecodeError, KeyError):
            pass

        if exit_code == 0:
            return "✅ No linting issues"
        return "❌ ESLint check failed"


class RuffModule(AnalysisModule):
    """B_Ruff: Python Linting and Formatting"""

    def get_command(self, files: list[str] | None = None) -> list[str]:
        # Use text output for streaming
        cmd = ["ruff", "check"]

        target_dir = "."
        # Agnostic check: if pyproject.toml is not in root, check immediate subdirectories
        if not (self.project_path / "pyproject.toml").exists():
            found = False
            for path in self.project_path.iterdir():
                if path.is_dir() and (path / "pyproject.toml").exists():
                    target_dir = path.name
                    found = True
                    break

            if not found:
                self.config_warning = "Configuration file 'pyproject.toml' not found. Using default settings."

        if files is not None:
            py_files = [f for f in files if f.endswith(".py")]
            if py_files:
                cmd.extend(py_files)
            else:
                return []
        else:
            cmd.append(target_dir)

        return cmd

    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        if exit_code == 0:
            return "✅ No linting issues"

        # Parse text output for error count
        # Example: "Found 2 errors."
        match = re.search(r"Found (\d+) error", stdout)
        if match:
            count = match.group(1)
            return f"❌ {count} issue(s) found"

        # Fallback: count lines that look like errors (file:line:col)
        error_lines = len(re.findall(r"^.+:\d+:\d+: [A-Z]\d+", stdout, re.MULTILINE))
        if error_lines > 0:
            return f"❌ {error_lines} issue(s) found"

        return "❌ Ruff check failed"


class PyrightModule(AnalysisModule):
    """B_Pyright: Python Strict Type Checking"""

    def get_command(self, files: list[str] | None = None) -> list[str]:
        # Use python3 -m pyright
        # Remove --outputjson to get text output for streaming
        # Force version to avoid warning
        import os

        os.environ["PYRIGHT_PYTHON_FORCE_VERSION"] = "latest"
        cmd = ["python3", "-m", "pyright"]

        target_dir = "."
        # Agnostic check: if pyproject.toml is not in root, check immediate subdirectories
        if not (self.project_path / "pyproject.toml").exists():
            found = False
            for path in self.project_path.iterdir():
                if path.is_dir() and (path / "pyproject.toml").exists():
                    target_dir = path.name
                    found = True
                    break

            if not found:
                self.config_warning = "Configuration file 'pyproject.toml' not found. Using default settings."

        if files is not None:
            py_files = [f for f in files if f.endswith(".py")]
            if py_files:
                cmd.extend(py_files)
            else:
                return []
        else:
            cmd.append(target_dir)

        return cmd

    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        if exit_code == 0:
            return "✅ No type errors (strict mode)"

        # Parse text output
        # Example: "2 errors, 0 warnings, 0 informations"
        match = re.search(r"(\d+) error", stdout)
        if match:
            error_count = int(match.group(1))
            if error_count > 0:
                return f"❌ {error_count} type error(s) found"

        return "❌ Pyright check failed"


class LizardModule(AnalysisModule):
    """B_Lizard: Cyclomatic Complexity (Max 15) - Python & TypeScript/JavaScript"""

    def get_command(self, files: list[str] | None = None) -> list[str]:
        # Use python3 -m lizard
        cmd = [
            "python3",
            "-m",
            "lizard",
            "--CCN",
            "15",
            "--warnings_only",
            "--exclude",
            "*/venv/*",
            "--exclude",
            "*/.venv/*",
            "--exclude",
            "*/env/*",
            "--exclude",
            "*/node_modules/*",
            "--exclude",
            "*/.next/*",
            "--exclude",
            "**/.venv/*",
            "--exclude",
            "**/venv/*",
            "--exclude",
            "**/node_modules/*",
            "--exclude",
            "**/dist/*",
            "--exclude",
            "**/build/*",
        ]

        # Always analyze the root directory to include both Backend (Python) and Frontend (TS/JS)
        # Lizard handles multiple languages and we already have excludes for venv/node_modules
        target_dir = "."

        if files is not None:
            # Filter for Python, TypeScript, and JavaScript files
            target_files = [f for f in files if f.endswith((".py", ".ts", ".tsx", ".js", ".jsx"))]
            if target_files:
                cmd.extend(target_files)
            else:
                return []
        else:
            cmd.append(target_dir)

        return cmd

    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        # Lizard prints warnings for functions exceeding CCN threshold
        warning_lines = [
            line for line in stdout.split("\n") if "warning:" in line.lower() or line.strip().startswith("!!")
        ]

        if not warning_lines:
            return "✅ All functions under complexity 15"

        return f"❌ {len(warning_lines)} function(s) exceed complexity 15"


# ============================================================================
# MODULE REGISTRY
# ============================================================================

MODULE_CLASSES = {
    "F_TypeScript": TypeScriptModule,
    "F_ESLint": ESLintModule,
    "B_Ruff": RuffModule,
    "B_Pyright": PyrightModule,
    "B_Lizard": LizardModule,
}

MODULE_METADATA = [
    {
        "id": "F_TypeScript",
        "title": "TypeScript",
        "subtitle": "Type Checking",
        "icon": "check-square",
    },
    {
        "id": "F_ESLint",
        "title": "ESLint",
        "subtitle": "Linter/Quality",
        "icon": "shield-check",
    },
    {
        "id": "B_Ruff",
        "title": "Ruff",
        "subtitle": "Linting & Formatting",
        "icon": "zap",
    },
    {
        "id": "B_Pyright",
        "title": "Pyright",
        "subtitle": "Type Checking Strict",
        "icon": "check-square",
    },
    {
        "id": "B_Lizard",
        "title": "Lizard",
        "subtitle": "Complexity (Py/TS/JS)",
        "icon": "cpu",
    },
]
