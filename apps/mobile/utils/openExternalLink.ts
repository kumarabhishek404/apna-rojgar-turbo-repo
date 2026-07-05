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

export async function openPlayStore(): Promise<boolean> {
  const webUrl = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;

  if (Platform.OS === "android") {
    const opened = await openExternalLink(webUrl, {
      appUrl: `market://details?id=${PLAY_STORE_PACKAGE}`,
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
