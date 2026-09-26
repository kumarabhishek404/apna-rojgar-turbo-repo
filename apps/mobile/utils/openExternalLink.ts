import { Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { PLAY_STORE_PACKAGE } from "@/constants/socialLinks";

/**
 * Opens external URLs reliably. Avoids Linking.canOpenURL for https links —
 * on iOS it often returns false unless the scheme is whitelisted, which blocks
 * social and website links from opening.
 */
export async function openExternalLink(
  url: string,
  options?: { appUrl?: string },
): Promise<boolean> {
  const candidates = [options?.appUrl, url].filter(Boolean) as string[];

  for (const target of candidates) {
    try {
      await Linking.openURL(target);
      return true;
    } catch {
      // Try the next candidate.
    }
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      await WebBrowser.openBrowserAsync(url);
      return true;
    } catch {
      // Fall through.
    }
  }

  console.warn("Cannot open URL:", url);
  return false;
}

/** Native Play Store listing for this app (stars + Write a review on the page). */
export function getPlayStoreListingUrl(): string {
  return `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;
}

/**
 * Opens this app in the Play Store app (not a browser) so the user can rate
 * and review. Google does not allow a deep link that auto-opens the write-review
 * composer; the listing page is the supported destination.
 */
export async function openPlayStore(): Promise<boolean> {
  const webUrl = getPlayStoreListingUrl();
  const marketUrl = `market://details?id=${PLAY_STORE_PACKAGE}`;

  if (Platform.OS === "android") {
    try {
      const IntentLauncher = await import("expo-intent-launcher");
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: marketUrl,
        packageName: "com.android.vending",
      });
      return true;
    } catch {
      // Play Store missing or intent rejected — try market:// then https.
    }

    const opened = await openExternalLink(webUrl, { appUrl: marketUrl });
    if (opened) return true;
  }

  return openExternalLink(webUrl);
}

/** Opens the Play Store listing on the reviews / write-a-review surface. */
export async function openPlayStoreWriteReview(): Promise<boolean> {
  const webUrl = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}&showAllReviews=true`;

  if (Platform.OS === "android") {
    const opened = await openExternalLink(webUrl, {
      appUrl: `market://details?id=${PLAY_STORE_PACKAGE}&showAllReviews=true`,
    });
    if (opened) return true;
  }

  return openExternalLink(webUrl);
}

export async function openInstagramProfile(profileUrl: string): Promise<boolean> {
  const username = profileUrl
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "")
    .split("/")[0]
    .split("?")[0];

  if (!username) {
    return openExternalLink(profileUrl);
  }

  return openExternalLink(profileUrl, {
    appUrl: `instagram://user?username=${username}`,
  });
}
