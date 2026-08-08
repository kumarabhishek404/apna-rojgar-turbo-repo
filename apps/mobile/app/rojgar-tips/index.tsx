import { useEffect } from "react";
import { router } from "expo-router";

/** Deep-link / scheme bridge → native tips list. */
export default function RojgarTipsListBridge() {
  useEffect(() => {
    router.replace("/screens/rojgar-tips");
  }, []);
  return null;
}
