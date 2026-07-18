/**
 * `https://apnarojgarindia.com/app` often arrives as `apnarojgar://app`.
 * Expo extracts that as path `"app"`.
 *
 * IMPORTANT: Do NOT return `"/(tabs)"` here — Expo strips it to path `"(tabs)"`,
 * which is unmatched. Return `"/"` so the home route loads.
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    if (isAppDownloadDeepLink(path)) {
      return "/";
    }
    return path;
  } catch {
    return path;
  }
}

function isAppDownloadDeepLink(raw: string): boolean {
  const value = String(raw || "").trim();
  if (!value) return false;

  const lower = value.toLowerCase();

  // Path forms after Expo extraction: "app", "/app"
  if (
    lower === "app" ||
    lower === "/app" ||
    lower === "/app/" ||
    lower === "app/"
  ) {
    return true;
  }

  // Full custom-scheme / https URLs
  if (
    lower === "apnarojgar://app" ||
    lower.startsWith("apnarojgar://app?") ||
    lower.startsWith("apnarojgar://app/") ||
    lower === "apnarojgar:///app" ||
    lower.startsWith("apnarojgar:///app?") ||
    /(?:^|\/\/)(?:www\.)?apnarojgarindia\.com\/app\/?(?:\?|#|$)/i.test(lower)
  ) {
    return true;
  }

  try {
    const href = value.includes("://") ? value : `apnarojgar://${value}`;
    const url = new URL(href);
    const host = (url.hostname || "").toLowerCase();
    const pathname = (url.pathname || "/").replace(/\/+$/, "") || "/";

    if (host === "app" && pathname === "/") return true;
    if (pathname === "/app") return true;
    if (
      (host === "apnarojgarindia.com" || host === "www.apnarojgarindia.com") &&
      pathname === "/app"
    ) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}
