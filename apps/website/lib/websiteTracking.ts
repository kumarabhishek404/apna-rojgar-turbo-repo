import { getAuth } from "@/lib/auth";
import { isAdminUser } from "@/lib/isAdminUser";

export type WebsiteTrackingProperties = Record<string, unknown>;

export type WebsiteTrackingEventDetail = {
  name: string;
  properties?: WebsiteTrackingProperties;
};

export const WEBSITE_TRACK_EVENT = "apna-rojgar:track-event";

export function trackWebsiteEvent(name: string, properties?: WebsiteTrackingProperties) {
  if (typeof window === "undefined") return;

  // Admin sessions are skipped by WebsiteActivityTracker + backend postBatch.
  try {
    const auth = getAuth();
    const user = (auth?.user || {}) as { role?: string | null };
    if (isAdminUser(user)) return;
  } catch {
    /* ignore — tracker/backend still gate */
  }

  window.dispatchEvent(
    new CustomEvent<WebsiteTrackingEventDetail>(WEBSITE_TRACK_EVENT, {
      detail: { name, properties },
    }),
  );
}
