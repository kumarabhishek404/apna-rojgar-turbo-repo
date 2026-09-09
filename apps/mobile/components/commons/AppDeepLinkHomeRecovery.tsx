import { useEffect } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { getDefaultStore } from "jotai";
import Atoms from "@/app/AtomStore";
import { isAccountSuspended } from "@/utils/userStatus";

function shouldOpenHome(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower === "apnarojgar://app" ||
    lower.startsWith("apnarojgar://app?") ||
    lower.startsWith("apnarojgar://app/") ||
    lower === "apnarojgar:///app" ||
    /(?:www\.)?apnarojgarindia\.com\/app\/?(?:\?|#|$)/i.test(lower)
  );
}

/**
 * Belt-and-suspenders: if Android opens `apnarojgar://app`, force home.
 * Uses imperative `router` so it works from the root layout.
 */
export default function AppDeepLinkHomeRecovery() {
  useEffect(() => {
    const goHome = (url: string | null | undefined) => {
      if (!shouldOpenHome(url)) return;
      if (isAccountSuspended(getDefaultStore().get(Atoms.UserAtom))) return;
      setTimeout(() => {
        try {
          router.replace("/");
        } catch (error) {
          console.warn("[AppDeepLinkHomeRecovery] replace failed:", error);
        }
      }, 50);
    };

    void Linking.getInitialURL().then(goHome);
    const sub = Linking.addEventListener("url", ({ url }) => goHome(url));
    return () => sub.remove();
  }, []);

  return null;
}
