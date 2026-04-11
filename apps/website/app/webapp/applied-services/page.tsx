"use client";

import { Suspense } from "react";
import ServicesPage from "@/app/webapp/services/ServicesPageClient";

/**
 * Standalone webapp route: same layout as “All services” / `ServicesPage`, `forcedTab="applied"`.
 */
export default function AppliedServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <ServicesPage forcedTab="applied" />
    </Suspense>
  );
}
