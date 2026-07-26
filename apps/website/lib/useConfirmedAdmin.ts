"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
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

    apiRequest<{ data?: { role?: string; mobile?: string | number } }>("/user/info")
      .then((res) => {
        if (!mounted) return;
        setIsAdmin(
          isAdminUser({
            role: res?.data?.role || null,
            mobile: res?.data?.mobile || null,
          }),
        );
        setAdminChecked(true);
      })
      .catch(() => {
        if (!mounted) return;
        setIsAdmin(false);
        setAdminChecked(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const showAdminUi = adminChecked && isAdmin;

  return { isAdmin: showAdminUi, adminChecked, showAdminUi };
}
