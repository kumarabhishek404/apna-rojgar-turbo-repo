import { useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from "react";

export default function RojgarTipsListBridge() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    router.replace("/screens/rojgar-tips");
  }, [router, rootNavigationState?.key]);

  return null;
}
