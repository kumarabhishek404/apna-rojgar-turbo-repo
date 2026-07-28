"use client";

import { useEffect, useState } from "react";
import { APP_PAGE_URL, APPLINK } from "@/constants";
import { useLanguage } from "@/components/LanguageProvider";

const DISMISS_KEY = "ar_blog_app_banner_dismissed_v1";
const ANDROID_PACKAGE = "com.kumarabhishek404.labourapp";

function isInAppWebView(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("inApp") === "1") return true;
    if (
      Boolean(
        (window as unknown as { ReactNativeWebView?: unknown })
          .ReactNativeWebView,
      )
    ) {
      return true;
    }
    if (
      Boolean(
        (window as unknown as { isApnaRojgarApp?: boolean }).isApnaRojgarApp,
      )
    ) {
      return true;
    }
    if (/; wv\)/i.test(navigator.userAgent || "")) return true;
  } catch {
    // ignore
  }
  return false;
}

function wasDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

function dismissForDays(days = 30) {
  try {
    localStorage.setItem(
      DISMISS_KEY,
      String(Date.now() + days * 24 * 60 * 60 * 1000),
    );
  } catch {
    // ignore
  }
}

async function isAndroidAppInstalled(): Promise<boolean> {
  try {
    const nav = navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<Array<{ id?: string }>>;
    };
    if (typeof nav.getInstalledRelatedApps !== "function") return false;
    const apps = await nav.getInstalledRelatedApps();
    return (apps || []).some(
      (app) =>
        String(app?.id || "").toLowerCase() === ANDROID_PACKAGE.toLowerCase(),
    );
  } catch {
    return false;
  }
}

/**
 * Sticky install CTA on public tip pages (mobile browser only).
 * Hidden when: in-app WebView, user dismissed, or Android app already installed.
 */
export default function BlogAppInstallBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (isInAppWebView() || wasDismissed()) {
        if (!cancelled) setVisible(false);
        return;
      }

      if (await isAndroidAppInstalled()) {
        if (!cancelled) setVisible(false);
        return;
      }

      if (!cancelled) setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4">
      <div className="pointer-events-auto relative flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-[#22409a]/20 bg-white/95 p-3 pr-10 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 sm:pr-12">
        <button
          type="button"
          aria-label={t("close", "Close")}
          onClick={() => {
            dismissForDays(30);
            setVisible(false);
          }}
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          ×
        </button>

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
