"use client";

import { useEffect, useState } from "react";
import { apiRequest, getAuth } from "@/lib/auth";
import { isAdminUser } from "@/lib/isAdminUser";

/**
 * Admin UI defaults to false (normal user).
 * Only becomes true after /user/info confirms role === ADMIN.
 * Never trust localStorage for showing admin options.
 */
export function useConfirmedAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsAdmin(false);
    setAdminChecked(false);

    const finish = (admin: boolean) => {
      if (!mounted) return;
      setIsAdmin(admin);
      setAdminChecked(true);
    };

    const run = async () => {
      if (!getAuth()?.token) {
        finish(false);
        return;
      }

      try {
        const res = await apiRequest<{
          data?: { role?: string; mobile?: string | number };
        }>("/user/info");
        finish(
          isAdminUser({
            role: res?.data?.role || null,
            mobile: res?.data?.mobile || null,
          }),
        );
      } catch {
        // Keep non-admin UI; do not treat transient errors as logout here.
        finish(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const showAdminUi = adminChecked && isAdmin;

  return { isAdmin: showAdminUi, adminChecked, showAdminUi };
}
