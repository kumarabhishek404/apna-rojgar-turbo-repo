import React, { useEffect } from "react";
import { Redirect, usePathname, useRouter } from "expo-router";
import * as Linking from "expo-linking";

function isAppDeepLink(value: string | null | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return (
    lower === "app" ||
    lower === "/app" ||
    lower.endsWith("/app") ||
    lower === "apnarojgar://app" ||
    lower.startsWith("apnarojgar://app?") ||
    /apnarojgarindia\.com\/app\/?(?:\?|#|$)/i.test(lower)
  );
}

/**
 * Catch unmatched routes. Especially recovers `apnarojgar://app`.
 */
export default function NotFoundScreen() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    void Linking.getInitialURL().then((url) => {
      if (!alive) return;
      if (isAppDeepLink(url) || isAppDeepLink(pathname)) {
        router.replace("/");
      }
    });
    return () => {
      alive = false;
    };
  }, [pathname, router]);

  // Always recover to home instead of trapping users on the error screen.
  return <Redirect href="/" />;
}
