import React from "react";
import { Redirect } from "expo-router";

/**
 * Fallback if `/app` is matched as a normal path (https App Link).
 * Custom-scheme form `apnarojgar://app` is rewritten in `+native-intent.tsx`.
 */
export default function AppDeepLinkBridge() {
  return <Redirect href="/(tabs)" />;
}
