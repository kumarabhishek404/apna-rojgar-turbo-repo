"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { APPLINK } from "@/constants";
import LOGO from "../public/logo.png";

const PLAY_PACKAGE = "com.kumarabhishek404.labourapp";
const MARKET_URL = `market://details?id=${PLAY_PACKAGE}`;

function openPlayStore() {
  const isAndroid =
    typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

  if (isAndroid) {
    // Prefer Play Store app; fall back to HTTPS listing.
    window.location.href = MARKET_URL;
    window.setTimeout(() => {
      window.location.href = APPLINK;
    }, 800);
    return;
  }

  window.location.href = APPLINK;
}

export default function AppLandingPage() {
  const { t } = useLanguage();

  useEffect(() => {
    openPlayStore();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#22409a] text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-[#f5c542]/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <Image
            src={LOGO}
            alt={t("apnaRojgarLogoAlt", "Apna Rojgar Logo")}
            width={56}
            height={56}
            className="rounded-xl bg-white p-1 shadow-lg"
            priority
          />
          <span className="text-2xl font-bold tracking-tight">
            {t("brandName", "Apna Rojgar")}
          </span>
        </Link>

        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-blue-100">
          apnarojgarindia.com/app
        </p>

        <h1 className="mb-4 text-4xl font-bold leading-tight sm:text-5xl">
          {t("appLandingTitle", "Get the Apna Rojgar App")}
        </h1>

        <p className="mb-10 max-w-xl text-base text-blue-100 sm:text-lg">
          {t("appLandingOpening", "Opening Play Store…")}
        </p>

        <button
          type="button"
          onClick={openPlayStore}
          className="inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-semibold text-[#22409a] shadow-lg transition hover:scale-105"
        >
          <Download size={20} />
          {t("appLandingCta", "Open Play Store")}
        </button>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href={APPLINK}
            className="underline decoration-white/40 underline-offset-4 hover:decoration-white"
          >
            {t("appLandingOpenStore", "Play Store link")}
          </a>
          <span className="text-white/40">·</span>
          <Link
            href="/"
            className="underline decoration-white/40 underline-offset-4 hover:decoration-white"
          >
            {t("appLandingBackHome", "Back to website")}
          </Link>
        </div>
      </div>
    </main>
  );
}
