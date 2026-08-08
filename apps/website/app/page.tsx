"use client";

import { useEffect, useState } from "react";
import PublicHome from "@/components/PublicHome";
import ServicesDashboard from "@/components/webapp/ServicesDashboard";
import { checkStoredToken, getAuth } from "@/lib/auth";

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
      const result = await checkStoredToken();
      if (!active) return;
      // unknown (network/5xx): keep dashboard if token exists — don't bounce to public home.
      setShowDashboard(result === "valid" || result === "unknown");
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  if (showDashboard) {
    return <ServicesDashboard />;
  }

  return <PublicHome />;
}
