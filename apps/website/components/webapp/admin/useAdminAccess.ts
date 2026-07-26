"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/auth";
import { isAdminUser } from "@/lib/isAdminUser";

export function useAdminAccess() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let mounted = true;
    // Stay on "loading" until API confirms — never flash admin UI from cache.
    apiRequest<{ data?: { role?: string; mobile?: string } }>("/user/info")
      .then((res) => {
        if (!mounted) return;
        const ok = isAdminUser(res?.data);
        setStatus(ok ? "allowed" : "denied");
        if (!ok) router.replace("/all-services");
      })
      .catch(() => {
        if (!mounted) return;
        setStatus("denied");
        router.replace("/all-services");
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  return status;
}

