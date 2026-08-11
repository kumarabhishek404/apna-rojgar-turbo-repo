import {
  useLocalSearchParams,
  useRootNavigationState,
  useRouter,
} from "expo-router";
import { useEffect } from "react";

/**
 * `https://apnarojgarindia.com/job/<id>` and `apnarojgar://job/<id>` resolve here,
 * then we open service details (same as manual navigation).
 *
 * Wait for the root navigator to mount before `router.replace` — replacing too
 * early throws "Attempted to navigate before mounting the Root Layout".
 */
export default function JobDeepLinkBridge() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    if (id) {
      router.replace({
        pathname: "/screens/service/[id]",
        params: { id: String(id) },
      });
      return;
    }

    router.replace("/");
  }, [id, router, rootNavigationState?.key]);

  return null;
}
