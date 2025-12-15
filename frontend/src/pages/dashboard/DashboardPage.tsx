"use client";

import { ErrorBoundary } from "@/shared";
import { DashboardContainer } from "@/widgets/dashboard";

export function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContainer />
    </ErrorBoundary>
  );
}
