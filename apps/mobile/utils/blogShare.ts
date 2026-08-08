import { Share } from "react-native";
import {
  ROJGAR_TIPS_ORIGIN,
  ROJGAR_TIPS_LIST_PATH,
  rojgarTipsArticleUrl,
  rojgarTipsListUrl,
  parseRojgarTipsDeepLink,
  isRojgarTipsPath,
  rojgarTipsAppRoute,
  ROJGAR_TIPS_HOSTS,
  withInAppParam,
} from "./rojgarTipsLinks";

export {
  ROJGAR_TIPS_ORIGIN,
  ROJGAR_TIPS_LIST_PATH,
  rojgarTipsArticleUrl,
  rojgarTipsListUrl,
  parseRojgarTipsDeepLink,
  isRojgarTipsPath,
  rojgarTipsAppRoute,
  ROJGAR_TIPS_HOSTS,
  withInAppParam,
};

/** Native Expo routes (not WebView). */
export function nativeTipsListPath() {
  return "/screens/rojgar-tips";
}

export function nativeTipsDetailPath(slug: string) {
  const clean = String(slug || "").replace(/^\/+|\/+$/g, "").trim();
  return `/screens/rojgar-tips/${encodeURIComponent(clean)}`;
}

/** Public website URL used for system share (SEO). */
export function tipsShareUrl(slug: string) {
  return rojgarTipsArticleUrl(slug, false);
}

export async function shareTipArticle(opts: {
  title: string;
  slug: string;
  messagePrefix?: string;
}) {
  const url = tipsShareUrl(opts.slug);
  const message = opts.messagePrefix
    ? `${opts.messagePrefix}\n\n${opts.title}\n${url}`
    : `${opts.title}\n${url}`;
  await Share.share({ message, title: opts.title, url });
}
