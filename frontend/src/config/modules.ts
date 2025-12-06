import { ModuleConfig } from "@/types/analysis";

export const MODULES_CONFIG: ModuleConfig[] = [
  // Frontend modules (2)
  {
    id: "F_TypeScript",
    title: "TypeScript",
    subtitle: "Type Checking",
    icon: "check-square",
    role: "frontend",
  },
  {
    id: "F_ESLint",
    title: "ESLint",
    subtitle: "Linter/Quality",
    icon: "shield-check",
    role: "frontend",
  },

  // Backend modules (3)
  {
    id: "B_Ruff",
    title: "Ruff",
    subtitle: "Linting & Formatting",
    icon: "zap",
    role: "backend",
  },
  {
    id: "B_Pyright",
    title: "Pyright",
    subtitle: "Type Checking Strict",
    icon: "check-square",
    role: "backend",
  },
  {
    id: "B_Lizard",
    title: "Lizard",
    subtitle: "Cyclomatic (Max 15)",
    icon: "cpu",
    role: "backend",
  },
];
