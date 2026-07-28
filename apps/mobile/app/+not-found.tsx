import React, { useEffect } from "react";
import { Redirect, usePathname, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import {
  isRojgarTipsPath,
  rojgarTipsAppRoute,
} from "@/utils/rojgarTipsLinks";

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
 * Catch unmatched routes. Recovers `/app` and tip/blog deep links.
 */
export default function NotFoundScreen() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    void Linking.getInitialURL().then((url) => {
      if (!alive) return;
      if (isRojgarTipsPath(url || "") || isRojgarTipsPath(pathname || "")) {
        router.replace(rojgarTipsAppRoute(url || pathname || "") as any);
        return;
      }
      if (isAppDeepLink(url) || isAppDeepLink(pathname)) {
        router.replace("/");
      }
    });
    return () => {
      alive = false;
    };
  }, [pathname, router]);

  if (isRojgarTipsPath(pathname || "")) {
    return <Redirect href={rojgarTipsAppRoute(pathname) as any} />;
  }

  // Always recover to home instead of trapping users on the error screen.
  return <Redirect href="/" />;
}
