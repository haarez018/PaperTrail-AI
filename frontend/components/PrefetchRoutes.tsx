"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Invisible component that eagerly prefetches high-traffic routes
 * so navigation feels instant. Mount it inside any server-rendered layout.
 */
export function PrefetchRoutes({ routes }: { routes: string[] }) {
  const router = useRouter();

  useEffect(() => {
    routes.forEach((r) => router.prefetch(r));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
