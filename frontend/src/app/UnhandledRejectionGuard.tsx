"use client";

import { useEffect } from "react";

type CancelationReason = {
  type?: unknown;
  msg?: unknown;
};

function isMonacoCancelation(reason: unknown): reason is CancelationReason {
  if (!reason || typeof reason !== "object") return false;
  const r = reason as CancelationReason;
  return r.type === "cancelation" && r.msg === "operation is manually canceled";
}

export function UnhandledRejectionGuard() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (isMonacoCancelation(event.reason)) {
        // Prevent Next dev overlay / console from treating this benign cancellation as a runtime error.
        event.preventDefault();
        // Best-effort: stop other listeners (if supported).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event as any).stopImmediatePropagation?.();
      }
    };

    window.addEventListener("unhandledrejection", handler, { capture: true });
    return () =>
      window.removeEventListener("unhandledrejection", handler, {
        capture: true,
      } as any);
  }, []);

  return null;
}
