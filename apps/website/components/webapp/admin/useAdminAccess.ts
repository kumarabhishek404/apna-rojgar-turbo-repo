"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, getAuth } from "@/lib/auth";
import { isAdminUser } from "@/lib/isAdminUser";

export function useAdminAccess() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">(
    "loading",
  );

  useEffect(() => {
    let mounted = true;

    const deny = () => {
      if (!mounted) return;
      setStatus("denied");
      router.replace("/all-services");
    };

    const run = async () => {
      // Wait a tick so AuthBootstrap / localStorage hydrate can settle on hard refresh.
      await new Promise((r) => setTimeout(r, 0));
      if (!mounted) return;

      const auth = getAuth();
      if (!auth?.token) {
        deny();
        return;
      }

      const attempt = async () =>
        apiRequest<{ data?: { role?: string; mobile?: string } }>("/user/info");

      try {
        const res = await attempt();
        if (!mounted) return;
        const ok = isAdminUser(res?.data);
        setStatus(ok ? "allowed" : "denied");
        if (!ok) router.replace("/all-services");
      } catch {
        // One retry for transient production network blips after hard refresh.
        try {
          await new Promise((r) => setTimeout(r, 400));
          if (!mounted) return;
          if (!getAuth()?.token) {
            deny();
            return;
          }
          const res = await attempt();
          if (!mounted) return;
          const ok = isAdminUser(res?.data);
          setStatus(ok ? "allowed" : "denied");
          if (!ok) router.replace("/all-services");
        } catch {
          deny();
        }
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [router]);

  return status;
}
