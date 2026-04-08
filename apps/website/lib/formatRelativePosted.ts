import type { AppLanguage } from "@/lib/i18n";

/** Relative time label (e.g. "2 days ago") matching device locale for en/hi. */
export function formatRelativePosted(iso: string, language: AppLanguage): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffSec = Math.round((d.getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(language === "hi" ? "hi" : "en", {
    numeric: "auto",
  });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 7) return rtf.format(diffDay, "day");
  const diffWeek = Math.round(diffDay / 7);
  if (Math.abs(diffWeek) < 5) return rtf.format(diffWeek, "week");
  const diffMonth = Math.round(diffDay / 30);
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, "month");
  const diffYear = Math.round(diffDay / 365);
  return rtf.format(diffYear, "year");
}
