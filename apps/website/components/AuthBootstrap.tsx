"use client";

import { useEffect } from "react";
import { getAuth, validateStoredToken } from "@/lib/auth";

export default function AuthBootstrap() {
  useEffect(() => {
    const run = async () => {
      const auth = getAuth();
      if (!auth?.token) return;
      const valid = await validateStoredToken();
      if (valid) return;
      if (typeof window === "undefined") return;
      const publicPaths = new Set(["/", "/about", "/register"]);
      if (publicPaths.has(window.location.pathname)) return;
      window.location.href = "/?login=1";
    };
    run();
  }, []);

  return null;
}
