import React from "react";
import { Redirect } from "expo-router";

/** Matched when deep-link path is `app` / `/app`. */
export default function AppDeepLinkBridge() {
  return <Redirect href="/" />;
}
