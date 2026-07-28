"use client";

import { useEffect, useState } from "react";
import { APP_PAGE_URL, APPLINK } from "@/constants";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Sticky install CTA on public tip pages. Hidden when opened from the mobile
 * app WebView (`?inApp=1`) so readers already in the app are not nudged to install.
 */
export default function BlogAppInstallBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const inAppParam = params.get("inApp") === "1";
      const inWebView =
        // React Native WebView bridge
        Boolean((window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView) ||
        Boolean((window as unknown as { isApnaRojgarApp?: boolean }).isApnaRojgarApp) ||
        // Android WebView UA marker
        /; wv\)/i.test(navigator.userAgent || "");
      if (inAppParam || inWebView) {
        setVisible(false);
        return;
      }
    } catch {
      // ignore
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4">
      <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-[#22409a]/20 bg-white/95 p-3 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#16264f] sm:text-base">
            {t(
              "blogAppInstallTitle",
              "Find jobs instantly in the Apna Rojgar App",
            )}
          </p>
          <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
            {t(
              "blogAppInstallSubtitle",
              "Browse nearby work, apply fast, and get hiring updates on your phone.",
            )}
          </p>
        </div>
        <a
          href={APP_PAGE_URL || APPLINK}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#22409a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b347c]"
        >
          {t("installApp", "Install App")}
        </a>
      </div>
    </div>
  );
}
