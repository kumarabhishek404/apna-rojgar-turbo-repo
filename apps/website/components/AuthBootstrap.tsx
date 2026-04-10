"use client";

import { useEffect } from "react";
import { clearAuth, getAuth, validateStoredToken } from "@/lib/auth";

export default function AuthBootstrap() {
  useEffect(() => {
    const run = async () => {
      const auth = getAuth();
      if (!auth?.token) {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("auth_redirect_in_flight");
        }
        return;
      }
      const valid = await validateStoredToken();
      if (valid) return;
      if (typeof window === "undefined") return;
      clearAuth();
      const publicPaths = new Set(["/", "/register"]);
      if (publicPaths.has(window.location.pathname)) return;
      const inFlight = window.sessionStorage.getItem("auth_redirect_in_flight") === "1";
      if (inFlight) return;
      window.sessionStorage.setItem("auth_redirect_in_flight", "1");
      window.location.replace("/?login=1");
    };
    run();
  }, []);

  return null;
}
