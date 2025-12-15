"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared";
import { ReactNode } from "react";
import { useMetricsSync } from "@/app/_providers/useMetricsSync";
import { ConnectionManager } from "@/app/_providers/ConnectionManager";
import { CRTManager } from "@/app/_providers/CRTManager";

function MetricsSynchronizer() {
  useMetricsSync();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionManager />
      <MetricsSynchronizer />
      <CRTManager />
      {children}
    </QueryClientProvider>
  );
}
