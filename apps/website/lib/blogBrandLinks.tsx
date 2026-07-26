import type { ReactNode } from "react";
import { APPLINK } from "@/constants";

/** Company / product name variants that should promote the mobile app. */
const BRAND_PATTERN =
  /(अपना\s*रो[जज़]गार|Apna\s*Rojgar|Apna\s*Rozgar)/gi;

const APP_LINK_CLASS =
  "font-semibold text-[#22409a] underline decoration-[#22409a]/40 underline-offset-2 transition hover:text-[#1a3278] hover:decoration-[#1a3278]";

export function getMobileAppPromoUrl() {
  return APPLINK;
}

/**
 * Turn brand-name mentions in plain text into clickable app-store links.
 */
export function linkifyBrandMentions(text: string): ReactNode[] {
  if (!text) return [];

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  const pattern = new RegExp(BRAND_PATTERN.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <a
        key={`brand-${match.index}-${match[0]}`}
        href={APPLINK}
        target="_blank"
        rel="noopener noreferrer"
        className={APP_LINK_CLASS}
      >
        {match[0]}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : [text];
}

/**
 * Same linking for HTML blog bodies (skips existing tags / URLs).
 */
export function linkifyBrandMentionsInHtml(html: string): string {
  if (!html) return "";

  return html.replace(
    /(https?:\/\/[^\s<]+)|(<a\b[^>]*>[\s\S]*?<\/a>)|(<[^>]+>)|(अपना\s*रो[जज़]गार|Apna\s*Rojgar|Apna\s*Rozgar)/gi,
    (full, url, anchor, tag, brand) => {
      if (url || anchor || tag) return full;
      if (!brand) return full;
      return `<a href="${APPLINK}" target="_blank" rel="noopener noreferrer" class="${APP_LINK_CLASS}">${brand}</a>`;
    },
  );
}
