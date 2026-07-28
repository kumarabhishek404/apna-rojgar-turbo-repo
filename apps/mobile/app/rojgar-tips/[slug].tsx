import { useLocalSearchParams, useRouter } from "expo-router";
import { useLayoutEffect } from "react";

export default function RojgarTipsArticleBridge() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  useLayoutEffect(() => {
    if (slug) {
      router.replace({
        pathname: "/screens/rojgar-tips",
        params: { slug: String(slug) },
      });
      return;
    }

    router.replace("/screens/rojgar-tips");
  }, [router, slug]);

  return null;
}
