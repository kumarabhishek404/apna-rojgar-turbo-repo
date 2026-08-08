"use client";

import { useEffect } from "react";
import { checkStoredToken, clearAuth, getAuth } from "@/lib/auth";

/**
 * On hard refresh, confirm the stored JWT is still valid.
 * Only clearAuth + redirect when the server explicitly says the token is invalid.
 * Network / 5xx → leave the session alone (production blips were logging users out).
 */
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

      const result = await checkStoredToken();
      if (result === "valid" || result === "unknown") {
        return;
      }

      // result === "invalid"
      if (typeof window === "undefined") return;
      clearAuth();
      const publicPaths = new Set(["/", "/register"]);
      if (publicPaths.has(window.location.pathname)) return;
      const inFlight =
        window.sessionStorage.getItem("auth_redirect_in_flight") === "1";
      if (inFlight) return;
      window.sessionStorage.setItem("auth_redirect_in_flight", "1");
      window.location.replace("/?login=1");
    };
    void run();
  }, []);

  return null;
}
