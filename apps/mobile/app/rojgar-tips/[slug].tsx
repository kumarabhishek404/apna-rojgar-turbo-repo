import {
  useLocalSearchParams,
  useRootNavigationState,
  useRouter,
} from "expo-router";
import { useEffect } from "react";

export default function RojgarTipsArticleBridge() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    if (slug) {
      router.replace({
        pathname: "/screens/rojgar-tips",
        params: { slug: String(slug) },
      });
      return;
    }

    router.replace("/screens/rojgar-tips");
  }, [router, slug, rootNavigationState?.key]);

  return null;
}
