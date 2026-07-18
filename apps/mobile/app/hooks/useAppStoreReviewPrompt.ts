import { useEffect, useRef } from "react";
import { maybeAutoPromptForAppReview } from "@/utils/appStoreReview";
import { hasAuthenticatedUser, isSessionValid } from "@/utils/session";

/**
 * Once per app session, after the user is authenticated on main tabs,
 * may show the Play Store rate soft-prompt (cooldown + completed rules apply).
 */
export function useAppStoreReviewPrompt(userDetails: unknown, ready: boolean) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (!ready || ranRef.current) return;
    if (!isSessionValid(userDetails) || !hasAuthenticatedUser(userDetails)) {
      return;
    }

    ranRef.current = true;
    void maybeAutoPromptForAppReview();
  }, [ready, userDetails]);
}
