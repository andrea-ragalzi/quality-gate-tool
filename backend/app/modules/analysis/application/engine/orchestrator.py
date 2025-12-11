"""
Analysis Orchestrator V5.0 - Live Watch Exclusive
Implements strict resource control with Semaphore for stability
"""

import asyncio
import logging
from pathlib import Path
from typing import Any, Literal

from ...domain.ports import AnalysisNotifierPort
from .base_module import AnalysisModule
from .modules import MODULE_CLASSES

logger = logging.getLogger(__name__)

# CRITICAL: Resource protection semaphore to prevent RAM exhaustion
MAX_CONCURRENT_ANALYSIS = 3  # Conservative limit for local machine stability


class AnalysisOrchestrator:
    """
    Orchestrates parallel analysis execution with strict concurrency control
    MISSION: Guarantee local machine stability during continuous Live Watch
    """

    def __init__(
        self,
        project_path: str,
        mode: Literal["full", "incremental"],
        ws_manager: AnalysisNotifierPort,
        selected_tools: list[str] | None = None,
    ) -> None:
        self.project_path = Path(project_path)
        self.mode = mode
        self.ws_manager = ws_manager
        self.selected_tools = selected_tools
        # Semaphore for resource control
        self.analysis_semaphore = asyncio.Semaphore(MAX_CONCURRENT_ANALYSIS)
        self.results: dict[str, str] = {}  # module_id -> PASS/FAIL

    async def get_modified_files(self) -> list[str]:
        """
        Get list of modified files using git diff
        Returns empty list if not in incremental mode or git fails
        """
        if self.mode != "incremental":
            return []

        try:
            # Get files changed since last commit (or main branch)
            process = await asyncio.create_subprocess_exec(
                "git",
                "diff",
                "--name-only",
                "HEAD",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.project_path),
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                logger.warning(f"git diff failed: {stderr.decode()}")
                return []

            # Parse file list
            files = stdout.decode().strip().split("\n")
            files = [f for f in files if f]  # Remove empty strings

            logger.info(f"📝 Incremental mode: {len(files)} modified file(s)")
            return files

        except Exception as e:
            logger.error(f"Failed to get modified files: {e}")
            return []

    async def run_parallel_modules(self, files: list[str] | None = None) -> dict[str, str]:
        """
        Execute all modules with STRICT CONCURRENCY CONTROL (Mission Critical)
        Uses Semaphore to prevent RAM exhaustion on local machine
        Returns dict of module_id -> status (PASS/FAIL)
        """
        # Define 8 core modules (static analysis only)
        all_module_configs = [
            {"id": "F_TypeScript", "name": "TypeScript Type Check"},
            {"id": "F_ESLint", "name": "ESLint Quality"},
            {"id": "B_Ruff", "name": "Ruff Lint & Format"},
            {"id": "B_Pyright", "name": "Pyright Strict Types"},
            {"id": "B_Lizard", "name": "Lizard Complexity"},
        ]

        # Filter modules if selected_tools is provided
        if self.selected_tools:
            module_configs = [m for m in all_module_configs if m["id"] in self.selected_tools]
        else:
            module_configs = all_module_configs

        # Create all module instances
        modules: list[AnalysisModule] = []
        for config in module_configs:
            module_class = MODULE_CLASSES.get(config["id"])
            if module_class:
                module = module_class(
                    module_id=config["id"],
                    name=config["name"],
                    project_path=str(self.project_path),
                    ws_manager=self.ws_manager,
                )
                modules.append(module)

        async def run_module_with_semaphore(
            module: AnalysisModule,
        ) -> str | Literal["FAIL"]:
            """Wrapper to enforce semaphore limit - CRITICAL FOR STABILITY"""
            async with self.analysis_semaphore:
                logger.info(
                    f"🔓 Semaphore acquired for {module.module_id} (available: {self.analysis_semaphore._value})"
                )
                try:
                    result = await module.run(files)
                    return result
                except Exception as e:
                    logger.error(f"Module {module.module_id} failed: {e}")
                    return "FAIL"
                finally:
                    logger.info(f"🔒 Semaphore released for {module.module_id}")

        # Launch all modules with semaphore protection
        logger.info(f"🚀 Launching {len(modules)} modules (max {MAX_CONCURRENT_ANALYSIS} concurrent)")
        tasks: list[asyncio.Task[str | Literal["FAIL"]]] = [
            asyncio.create_task(run_module_with_semaphore(module)) for module in modules
        ]

        try:
            # Wait for all tasks to complete
            results: list[str | BaseException | Literal["FAIL"]] = await asyncio.gather(*tasks, return_exceptions=True)
        except asyncio.CancelledError:
            logger.info("🛑 Orchestrator cancelled, cancelling child modules...")
            for task in tasks:
                if not task.done():
                    task.cancel()
            # Wait for tasks to finish cancellation (important for cleanup)
            await asyncio.gather(*tasks, return_exceptions=True)
            raise

        # Collect results
        status_map: dict[str, str | Literal["FAIL"]] = {}
        for module, result in zip(modules, results, strict=False):
            if isinstance(result, BaseException):
                logger.error(f"Module {module.module_id} raised exception: {result}")
                status_map[module.module_id] = "FAIL"
            else:
                status_map[module.module_id] = result
                logger.info(f"✓ {module.module_id}: {result}")

        return status_map

    def calculate_final_status(self, module_results: dict[str, str]) -> Literal["PASS", "FAIL"]:
        """
        Calculate overall status based on module results
        PASS only if all modules passed
        """
        passes = sum(1 for status in module_results.values() if status == "PASS")
        fails = sum(1 for status in module_results.values() if status == "FAIL")
        skipped = sum(1 for status in module_results.values() if status == "SKIPPED")

        overall_status = "PASS" if fails == 0 else "FAIL"
        logger.info(f"📊 Final Status: {overall_status} ({passes} passed, {fails} failed, {skipped} skipped)")

        return overall_status

    async def execute(self, files: list[str] | None = None) -> dict[str, Any]:
        """
        Main execution method
        Returns analysis report
        """
        try:
            # Send global INIT
            await self.ws_manager.send_global_init()

            # Step 1: Determine files to analyze
            modified_files: list[str] | None = None

            if self.mode == "incremental":
                if files:
                    # Use explicitly provided files (e.g. from Watchdog)
                    modified_files = files
                    logger.info(f"🔍 Incremental analysis on {len(modified_files)} provided file(s): {modified_files}")
                else:
                    # Fallback to git diff
                    modified_files = await self.get_modified_files()
                    if modified_files:
                        logger.info(
                            f"🔍 Incremental analysis on {len(modified_files)} git-detected file(s): {modified_files}"
                        )

            if self.mode == "incremental" and modified_files:
                await self.ws_manager.broadcast_raw(
                    {
                        "type": "LOG",
                        "message": f"🔍 Incremental mode: analyzing {len(modified_files)} modified file(s)",
                    }
                )
            elif self.mode == "incremental" and not modified_files:
                logger.info("✨ No files modified, running full analysis")
                await self.ws_manager.broadcast_raw(
                    {
                        "type": "LOG",
                        "message": "✨ No modified files detected, running full analysis",
                    }
                )
                modified_files = None
            else:
                logger.info("🔍 Full analysis mode")
                await self.ws_manager.broadcast_raw({"type": "LOG", "message": "🔍 Full analysis mode"})
                modified_files = None

            # Step 2: Run all modules in parallel
            module_results = await self.run_parallel_modules(modified_files)

            # Step 3: Calculate final status
            overall_status = self.calculate_final_status(module_results)

            # Step 4: Send global END
            global_status = "SUCCESS" if overall_status == "PASS" else "FAILURE"
            await self.ws_manager.send_global_end(global_status)

            return {
                "status": overall_status,
                "mode": self.mode,
                "modules": module_results,
                "modified_files_count": len(modified_files) if modified_files else 0,
            }

        except Exception as e:
            logger.error(f"❌ Orchestration failed: {e}", exc_info=True)
            await self.ws_manager.broadcast_raw({"type": "ERROR", "message": f"Analysis failed: {str(e)}"})
            return {"status": "FAIL", "error": str(e)}
