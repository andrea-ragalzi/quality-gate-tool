import { ModuleConfig } from "@/types/analysis";

export const DEFAULT_MODULES: ModuleConfig[] = [
  {
    id: "F_TypeScript",
    title: "TypeScript",
    subtitle: "Type Checking",
    icon: "check-square",
  },
  {
    id: "F_ESLint",
    title: "ESLint",
    subtitle: "Linter/Quality",
    icon: "shield-check",
  },
  {
    id: "B_Ruff",
    title: "Ruff",
    subtitle: "Linting & Formatting",
    icon: "zap",
  },
  {
    id: "B_Pyright",
    title: "Pyright",
    subtitle: "Type Checking Strict",
    icon: "check-square",
  },
  {
    id: "B_Lizard",
    title: "Lizard",
    subtitle: "Complexity (Py/TS/JS)",
    icon: "cpu",
  },
];
