import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { nativeTipsDetailPath } from "@/utils/blogShare";

/** Deep-link / scheme bridge → native tip detail. */
export default function RojgarTipsArticleBridge() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();

  useEffect(() => {
    const value = typeof slug === "string" ? slug.trim() : "";
    if (value) {
      router.replace(nativeTipsDetailPath(value) as any);
      return;
    }
    router.replace("/screens/rojgar-tips");
  }, [slug]);

  return null;
}
