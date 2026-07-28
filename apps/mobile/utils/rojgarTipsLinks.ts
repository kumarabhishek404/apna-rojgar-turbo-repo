/**
 * Canonical website tips URLs (single source of truth with the public site).
 * Mobile opens these in a WebView; does not duplicate blog content.
 */
export const ROJGAR_TIPS_HOSTS = new Set([
  "apnarojgarindia.com",
  "www.apnarojgarindia.com",
]);

export const ROJGAR_TIPS_ORIGIN = "https://www.apnarojgarindia.com" as const;
export const ROJGAR_TIPS_LIST_PATH = "/rojgar-tips" as const;

const TIP_SECTIONS = new Set(["rojgar-tips", "blogs", "career-advice"]);

export function rojgarTipsListUrl(inApp = true): string {
  const url = `${ROJGAR_TIPS_ORIGIN}${ROJGAR_TIPS_LIST_PATH}`;
  return inApp ? withInAppParam(url) : url;
}

export function rojgarTipsArticleUrl(slug: string, inApp = true): string {
  const clean = String(slug || "")
    .replace(/^\/+|\/+$/g, "")
    .trim();
  const url = `${ROJGAR_TIPS_ORIGIN}${ROJGAR_TIPS_LIST_PATH}/${encodeURIComponent(clean)}`;
  return inApp ? withInAppParam(url) : url;
}

export function withInAppParam(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set("inApp", "1");
    return url.toString();
  } catch {
    const join = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${join}inApp=1`;
  }
}

/** True when URL/path is a public tip list or article. */
export function isRojgarTipsPath(raw: string): boolean {
  return Boolean(parseRojgarTipsDeepLink(raw));
}

export type RojgarTipsDeepLink = {
  kind: "list" | "article";
  slug?: string;
  href: string;
};

/**
 * Parse custom-scheme or https tip URLs / Expo-extracted paths into an in-app target.
 */
export function parseRojgarTipsDeepLink(
  raw: string,
): RojgarTipsDeepLink | null {
  const value = String(raw || "").trim();
  if (!value) return null;

  const lower = value.toLowerCase();

  // Expo-extracted path forms: "rojgar-tips", "/rojgar-tips/slug", "blogs/slug"
  const pathOnly = lower
    .replace(/^apnarojgar:\/\//, "")
    .replace(/^https?:\/\/(www\.)?apnarojgarindia\.com/i, "")
    .split("?")[0]
    .split("#")[0];

  const parts = pathOnly.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  // Host-as-path: apnarojgar://rojgar-tips/... → hostname may be "rojgar-tips"
  let section = parts[0];
  let slug: string | undefined = parts[1];

  if (!TIP_SECTIONS.has(section) && parts.length >= 2 && TIP_SECTIONS.has(parts[1])) {
    section = parts[1];
    slug = parts[2];
  }

  if (!TIP_SECTIONS.has(section)) return null;
  if (slug === "__static" || slug?.endsWith(".html")) return null;

  if (!slug) {
    return { kind: "list", href: rojgarTipsListUrl(true) };
  }

  return {
    kind: "article",
    slug,
    href: rojgarTipsArticleUrl(slug, true),
  };
}

/** Expo Router path for tip deep links. */
export function rojgarTipsAppRoute(rawOrParsed?: string | RojgarTipsDeepLink): string {
  const parsed =
    typeof rawOrParsed === "string" || rawOrParsed === undefined
      ? parseRojgarTipsDeepLink(String(rawOrParsed || ""))
      : rawOrParsed;

  if (!parsed) {
    return "/screens/rojgar-tips";
  }
  if (parsed.kind === "article" && parsed.slug) {
    return `/screens/rojgar-tips?slug=${encodeURIComponent(parsed.slug)}`;
  }
  return "/screens/rojgar-tips";
}
