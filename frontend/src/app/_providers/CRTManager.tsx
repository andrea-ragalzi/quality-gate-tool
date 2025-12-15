"use client";

import { useEffect } from "react";
import { useUIStore } from "@/shared";

export function CRTManager() {
  const crtEnabled = useUIStore((state) => state.crtEnabled);

  useEffect(() => {
    if (crtEnabled) {
      document.body.classList.add("crt-enabled");
    } else {
      document.body.classList.remove("crt-enabled");
    }
  }, [crtEnabled]);

  return null;
}
