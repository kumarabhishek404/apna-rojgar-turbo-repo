"use client";

import { useEffect, useState } from "react";
import PublicHome from "@/components/PublicHome";
import ServicesDashboard from "@/components/webapp/ServicesDashboard";
import { getAuth, validateStoredToken } from "@/lib/auth";

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const auth = getAuth();
      if (!auth?.token) {
        if (active) setShowDashboard(false);
        return;
      }
      const valid = await validateStoredToken();
      if (active) setShowDashboard(valid);
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  if (showDashboard) {
    return <ServicesDashboard />;
  }

  return <PublicHome />;
}
