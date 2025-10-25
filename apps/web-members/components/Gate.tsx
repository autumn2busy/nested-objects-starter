
"use client";

import { useEffect, useState } from "react";

type Props = {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Client-side gate for convenience UI. Server should still enforce access.
 * Expects window.Outseta.getJwtPayload() to return entitlements.
 */
export default function Gate({ feature, fallback = null, children }: Props) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const payload = await (window as any)?.Outseta?.getJwtPayload?.();
        const entitlements: string[] = payload?.claims?.entitlements || payload?.entitlements || [];
        setAllowed(entitlements.includes(feature));
      } catch {
        setAllowed(false);
      }
    };
    check();
  }, [feature]);

  return <>{allowed ? children : fallback}</>;
}
