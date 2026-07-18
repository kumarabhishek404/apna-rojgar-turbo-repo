import { useRouter } from "expo-router";
import { useLayoutEffect } from "react";

/**
 * Branded web URL `https://apnarojgarindia.com/app` (and `apnarojgar://app`)
 * is claimed by Android App Links. When the app is already installed, Expo
 * Router must match this path — otherwise users see "Unmatched Route".
 *
 * Send them into the main app (home tabs). Play Store download is only needed
 * when the app is not installed (handled by the website page in the browser).
 */
export default function AppDeepLinkBridge() {
  const router = useRouter();

  useLayoutEffect(() => {
    router.replace("/(tabs)");
  }, [router]);

  return null;
}
