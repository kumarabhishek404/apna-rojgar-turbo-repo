export type WebsiteTrackingProperties = Record<string, unknown>;

export type WebsiteTrackingEventDetail = {
  name: string;
  properties?: WebsiteTrackingProperties;
};

export const WEBSITE_TRACK_EVENT = "apna-rojgar:track-event";

export function trackWebsiteEvent(name: string, properties?: WebsiteTrackingProperties) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<WebsiteTrackingEventDetail>(WEBSITE_TRACK_EVENT, {
      detail: { name, properties },
    }),
  );
}
