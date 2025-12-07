"""
Quality Gate Analysis Modules - 6 Modules Specification
Modules: F_TypeScript, F_ESLint, F_Complexity, B_Ruff, B_Pyright, B_Lizard
"""

import json
import logging
import re
from typing import List

from .base_module import AnalysisModule

logger = logging.getLogger(__name__)


# ============================================================================
# ANALYSIS MODULES
# ============================================================================


class TypeScriptModule(AnalysisModule):
    """F_TypeScript: TypeScript Type Checking"""

    def get_command(self, files: List[str] = None) -> List[str]:
        # Run TypeScript compiler in check mode
        return ["npx", "tsc", "--noEmit", "--pretty", "false"]

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

    def get_command(self, files: List[str] = None) -> List[str]:
        cmd = ["npx", "eslint", "--format", "json"]

        if files:
            js_ts_files = [f for f in files if f.endswith((".js", ".ts", ".tsx", ".jsx"))]
            if js_ts_files:
                cmd.extend(js_ts_files)
            else:
                cmd.extend(["src/"])
        else:
            cmd.extend(["src/"])

        return cmd

    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
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


class ESLintComplexityModule(AnalysisModule):
    """F_Complexity: Cyclomatic Complexity Check (Max 15)"""

    def get_command(self, files: List[str] = None) -> List[str]:
        # ESLint with complexity rule enabled
        cmd = [
            "npx",
            "eslint",
            "--format",
            "json",
            "--rule",
            "complexity: [error, 15]",
            "--no-eslintrc",
        ]

        if files:
            js_ts_files = [f for f in files if f.endswith((".js", ".ts", ".tsx", ".jsx"))]
            if js_ts_files:
                cmd.extend(js_ts_files)
            else:
                cmd.extend(["src/"])
        else:
            cmd.extend(["src/"])

        return cmd

    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        try:
            if stdout.strip():
                results = json.loads(stdout)
                complexity_errors = []

                for result in results:
                    for msg in result.get("messages", []):
                        if "complexity" in msg.get("ruleId", "").lower():
                            complexity_errors.append(msg)

                if not complexity_errors:
                    return "✅ All functions under complexity limit (15)"

                return f"❌ {len(complexity_errors)} function(s) exceed complexity 15"
        except (json.JSONDecodeError, KeyError):
            pass

        return "❌ Complexity check failed" if exit_code != 0 else "✅ Complexity OK"


class RuffModule(AnalysisModule):
    """B_Ruff: Python Linting and Formatting"""

    def get_command(self, files: List[str] = None) -> List[str]:
        # Use text output for streaming
        cmd = ["ruff", "check"]

        if files:
            py_files = [f for f in files if f.endswith(".py")]
            if py_files:
                cmd.extend(py_files)
            else:
                cmd.append(".")
        else:
            cmd.append(".")

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

    def get_command(self, files: List[str] = None) -> List[str]:
        # Use python3 -u -m pyright to ensure unbuffered output
        # Remove --outputjson to get text output for streaming
        cmd = ["python3", "-u", "-m", "pyright"]

        if files:
            py_files = [f for f in files if f.endswith(".py")]
            if py_files:
                cmd.extend(py_files)
            else:
                cmd.append(".")
        else:
            cmd.append(".")

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
    """B_Lizard: Python Cyclomatic Complexity (Max 15)"""

    def get_command(self, files: List[str] = None) -> List[str]:
        # Use python3 -u -m lizard to ensure unbuffered output
        cmd = [
            "python3",
            "-u",
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
        ]

        if files:
            py_files = [f for f in files if f.endswith(".py")]
            if py_files:
                cmd.extend(py_files)
            else:
                cmd.append(".")
        else:
            cmd.append(".")

        return cmd

    def get_summary(self, stdout: str, stderr: str, exit_code: int) -> str:
        # Lizard prints warnings for functions exceeding CCN threshold
        warning_lines = [
            line
            for line in stdout.split("\n")
            if "warning:" in line.lower() or line.strip().startswith("!!")
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
    "F_Complexity": ESLintComplexityModule,
    "B_Ruff": RuffModule,
    "B_Pyright": PyrightModule,
    "B_Lizard": LizardModule,
}
