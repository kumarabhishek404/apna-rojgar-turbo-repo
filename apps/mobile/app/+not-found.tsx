import React from "react";
import { Redirect } from "expo-router";

/**
 * Recover from unmatched deep links (including `apnarojgar://app`) by opening home.
 */
export default function NotFoundScreen() {
  return <Redirect href="/(tabs)" />;
}
