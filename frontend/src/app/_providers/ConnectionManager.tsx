"use client";

import { useEffect } from "react";
import { useAnalysisStore } from "@/features/analysis";

export function ConnectionManager() {
  const { connect, disconnect } = useAnalysisStore();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return null;
}
