import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any


class QualityLogParser:
    """
    Parses aggregated output logs from static analysis tools (Ruff, Pyright, ESLint, TypeScript, Lizard)
    and structures the findings by source code module.
    """

    def __init__(self) -> None:
        # Initialize totals
        self.total_issues = {"ERROR": 0, "WARNING": 0, "INFO": 0, "COMPLEXITY": 0}

        # Store module data: file_path -> { metrics: {...}, complexity_metrics: {...} }
        self.modules_data = defaultdict(
            lambda: {
                "metrics": {"ERROR": 0, "WARNING": 0, "INFO": 0},
                "complexity_metrics": {"COMPLEXITY": 0, "MAX_CCN": 0},
            }
        )

        # Regex patterns
        # Capture file path: Start of line, non-greedy until a colon+digit or paren+digit
        # Matches:
        # path/to/file.py:10:5 ...
        # src/comp.tsx(10,5): ...
        self.file_pattern = re.compile(r"^(.+?)(?::\d+|\(\d+)")

        # Issue Type Patterns
        self.patterns = {
            "ERROR": [
                r"\b(error)\b",
                r"\b(E)\d+",  # Ruff/Flake8 E codes (often errors)
                r"\b(F)\d+",  # Pyflakes F codes (often errors)
                r"\b(C)\d+",  # McCabe complexity codes
                r"TS\d+",  # TypeScript codes
            ],
            "WARNING": [
                r"\b(warning)\b",
                r"\b(warn)\b",
                r"\b(W)\d+",  # Warning codes
            ],
            "INFO": [
                r"\b(note)\b",
                r"\b(info)\b",
                r"\b(information)\b",
                r"\b(I)\d+",
            ],
            "COMPLEXITY": [
                r"Cyclomatic complexity",
                r"CCN",
            ],
        }

        # Tool-specific configuration
        self.tool_config = {
            "F_TypeScript": {
                "extensions": (".ts", ".tsx", ".js", ".jsx"),
                "patterns": ["TS\\d+", "error"],
            },
            "F_ESLint": {
                "extensions": (".ts", ".tsx", ".js", ".jsx"),
                "patterns": ["error", "warning"],
            },
            "B_Ruff": {
                "extensions": (".py",),
                "patterns": [
                    "E\\d+",
                    "F\\d+",
                    "W\\d+",
                    "I\\d+",
                    "C\\d+",
                    "error",
                    "warning",
                ],
            },
            "B_Pyright": {
                "extensions": (".py",),
                "patterns": ["error", "note", "information", "warning"],
            },
            "B_Lizard": {
                "extensions": (".py", ".ts", ".tsx", ".js", ".jsx", ".cpp", ".h"),
                "patterns": ["Cyclomatic complexity", "CCN"],
            },
        }

    def parse_file(self, file_path: str, tool_id: str | None = None) -> dict[str, Any]:
        """Parses a log file from disk."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Log file not found: {file_path}")

        with open(path, encoding="utf-8") as f:
            return self.parse_content(f.read(), tool_id)

    def parse_content(self, content: str, tool_id: str | None = None) -> dict[str, Any]:
        """Parses the raw log content string."""
        # Reset data for new parse
        self._reset()

        lines = content.splitlines()
        for line in lines:
            line = line.strip()
            if not line:
                continue

            self._process_line(line, tool_id)

        return self._generate_report()

    def _reset(self) -> None:
        self.total_issues = {k: 0 for k in self.total_issues}
        self.modules_data.clear()

    def _process_line(self, line: str, tool_id: str | None = None) -> None:
        # 1. Extract File Path
        match = self.file_pattern.match(line)
        if not match:
            return  # Skip lines that don't look like file issues

        file_path = match.group(1).strip()

        # Filter out common noise/non-source files if necessary
        if file_path.startswith("Analysis started") or file_path.startswith("["):
            return

        # Tool-specific filtering
        if tool_id and tool_id in self.tool_config:
            config = self.tool_config[tool_id]
            # Check extension
            if not file_path.endswith(config["extensions"]):
                return

            # Optional: Check if line contains expected patterns for this tool
            # This might be too strict if tools output generic messages, but good for precision
            # if not any(re.search(p, line) for p in config["patterns"]):
            #    return

        # 2. Determine Issue Type
        issue_type = self._determine_issue_type(line)

        if not issue_type:
            return  # Could not classify

        # 3. Extract Complexity Value (if applicable)
        ccn_value = 0
        if issue_type == "COMPLEXITY":
            # Lizard format: ... warning Cyclomatic complexity > 15 (18)
            ccn_match = re.search(r"\((\d+)\)$", line)
            if ccn_match:
                ccn_value = int(ccn_match.group(1))

        # 4. Update Metrics
        self._update_metrics(file_path, issue_type, ccn_value)

    def _determine_issue_type(self, line: str) -> str | None:
        # Check Complexity first as it's specific
        for pattern in self.patterns["COMPLEXITY"]:
            if re.search(pattern, line, re.IGNORECASE):
                return "COMPLEXITY"

        # Check explicit types
        # We check Error, then Warning, then Info

        # Check for explicit "error" keyword or TS code
        for pattern in self.patterns["ERROR"]:
            if re.search(pattern, line, re.IGNORECASE):
                return "ERROR"

        # Check for explicit "warning" keyword
        for pattern in self.patterns["WARNING"]:
            if re.search(pattern, line, re.IGNORECASE):
                return "WARNING"

        # Check for explicit "info" keyword
        for pattern in self.patterns["INFO"]:
            if re.search(pattern, line, re.IGNORECASE):
                return "INFO"

        return None

    def _update_metrics(self, file_path: str, issue_type: str, ccn_value: int = 0) -> None:
        # Ensure module exists (defaultdict handles initialization)
        module_entry = self.modules_data[file_path]

        # Increment Global Total
        self.total_issues[issue_type] += 1

        # Increment Module Metric
        if issue_type == "COMPLEXITY":
            module_entry["complexity_metrics"]["COMPLEXITY"] += 1
            # Update Max CCN if this one is higher
            if ccn_value > module_entry["complexity_metrics"]["MAX_CCN"]:
                module_entry["complexity_metrics"]["MAX_CCN"] = ccn_value
        else:
            module_entry["metrics"][issue_type] += 1

    def _generate_report(self) -> dict[str, Any]:
        # Convert defaultdict to list of dicts
        modules_list = []
        for file_path, data in self.modules_data.items():
            modules_list.append(
                {
                    "file": file_path,
                    "metrics": data["metrics"],
                    "complexity_metrics": data["complexity_metrics"],
                }
            )

        return {"total_issues": self.total_issues, "modules": modules_list}


# Example usage block (for testing)
if __name__ == "__main__":
    sample_log = """
src/components/button.tsx(25,10): error TS2322: Type 'string' is not assignable to type 'number'.
backend/utils/helper.py:15:1 F401 'os' imported but unused
backend/core/complex.py:12: warning Cyclomatic complexity > 15 (18)
src/api/client.ts(10,1): warning: Some warning here
    """
    parser = QualityLogParser()
    report = parser.parse_content(sample_log)
    print(json.dumps(report, indent=2))
