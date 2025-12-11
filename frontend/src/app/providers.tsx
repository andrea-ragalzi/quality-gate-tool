"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ReactNode } from "react";
import { useMetricsSync } from "@/features/metrics/hooks/useMetricsSync";
import { ConnectionManager } from "@/components/ConnectionManager";

function MetricsSynchronizer() {
  useMetricsSync();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionManager />
      <MetricsSynchronizer />
      {children}
    </QueryClientProvider>
  );
}
