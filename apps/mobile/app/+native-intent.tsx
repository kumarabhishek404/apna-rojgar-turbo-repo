/**
 * Android App Links for `https://apnarojgarindia.com/app` often arrive as
 * `apnarojgar://app` — Expo treats `app` as the **hostname**, not path `/app`,
 * which previously showed "Unmatched Route".
 *
 * Rewrite those URLs to the main tabs before Expo Router matches routes.
 */
export function redirectSystemPath({
  path,
  initial: _initial,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    if (isAppDownloadDeepLink(path)) {
      return "/(tabs)";
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

  // Bare path forms Expo may pass through.
  if (lower === "app" || lower === "/app" || lower === "/app/") {
    return true;
  }

  // Custom scheme: apnarojgar://app  (hostname = app)
  if (
    lower === "apnarojgar://app" ||
    lower.startsWith("apnarojgar://app?") ||
    lower.startsWith("apnarojgar://app/") ||
    lower === "apnarojgar:///app" ||
    lower.startsWith("apnarojgar:///app?")
  ) {
    return true;
  }

  // Parsed URL forms (https App Link or apnarojgar://app).
  try {
    const href = value.includes("://") ? value : `apnarojgar://${value}`;
    const url = new URL(href);
    const host = (url.hostname || "").toLowerCase();
    const pathname = (url.pathname || "/").replace(/\/+$/, "") || "/";

    // apnarojgar://app  → hostname "app", path "/"
    if (host === "app" && pathname === "/") {
      return true;
    }

    // https://apnarojgarindia.com/app  → path "/app"
    if (
      (host === "apnarojgarindia.com" || host === "www.apnarojgarindia.com") &&
      pathname === "/app"
    ) {
      return true;
    }

    if (pathname === "/app") {
      return true;
    }
  } catch {
    return /(?:^|\/\/)(?:www\.)?apnarojgarindia\.com\/app\/?(?:\?|#|$)/i.test(
      lower,
    );
  }

  return false;
}
