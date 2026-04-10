import { Suspense } from "react";
import ServicesPage from "./ServicesPageClient";

export default function WebappServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <ServicesPage />
    </Suspense>
  );
}
