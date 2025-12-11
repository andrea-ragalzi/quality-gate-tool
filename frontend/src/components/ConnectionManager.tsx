"use client";

import { useEffect } from "react";
import { useAnalysisStore } from "@/features/analysis/stores/useAnalysisStore";

export function ConnectionManager() {
  const { connect, disconnect } = useAnalysisStore();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return null;
}
