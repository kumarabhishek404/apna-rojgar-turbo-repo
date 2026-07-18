/**
 * Deep links are handled by **Expo Router** (see `app.json` scheme + `extra.router.origin`).
 * Do **not** block the root layout or call `router.replace` before the Stack mounts — that breaks navigation.
 *
 * Supported URLs → routes:
 * - `https://apnarojgarindia.com/job/<id>` → `app/job/[id].tsx` → redirects to service details
 * - `https://www.apnarojgarindia.com/job/<id>` → same route resolution
 * - `https://apnarojgarindia.com/screens/service/<id>` → `app/screens/service/[id].tsx`
 * - `https://apnarojgarindia.com/app` → `+native-intent` rewrites to `/` (home)
 *   (must NOT rewrite to `/(tabs)` — that becomes unmatched path `(tabs)`)
 * - `apnarojgar://job/<id>` → `app/job/[id].tsx`
 *
 * Re-exports for share / notifications:
 */
export {
  getServiceDetailsDeepLink,
  getServiceDetailsDeepLinkScreensPath,
  getServiceDetailsUniversalLink,
  getServiceDetailsUniversalLinkScreensPath,
  parseServiceIdFromUrl,
  PLAY_STORE_LISTING_URL,
} from "@/utils/serviceDeepLink";
