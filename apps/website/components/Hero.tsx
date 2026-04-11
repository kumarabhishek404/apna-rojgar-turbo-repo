"use client";

import { ArrowRight, Download, Info } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LOGO from "../public/logo.png";
import { useLanguage } from "@/components/LanguageProvider";
import { getAuth } from "@/lib/auth";

type HeroStats = {
  totalUsers: number;
  totalServices: number;
  totalCities: number;
};

const HeroSection = () => {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [stats, setStats] = useState<HeroStats | null>(null);
  const [showShlokMeaning, setShowShlokMeaning] = useState(false);

  const handleGetWorkClick = () => {
    const auth = getAuth();
    if (auth?.token) {
      router.push("/all-services");
      return;
    }
    router.push("/?login=1");
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const base =
          process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";
        const response = await fetch(`${base}/service/public/platform-stats`);
        const json = await response.json();
        if (!response.ok || json?.success === false) return;
        if (!cancelled && json?.data) {
          setStats(json.data);
        }
      } catch {
        // Keep null stats on network/API failure.
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const formattedStats = useMemo(() => {
    const format = (value: number) =>
      new Intl.NumberFormat(language === "hi" ? "hi-IN" : "en-IN").format(value || 0);
    return {
      totalUsers: format(stats?.totalUsers ?? 0),
      totalServices: format(stats?.totalServices ?? 0),
      totalCities: format(stats?.totalCities ?? 0),
    };
  }, [stats, language]);

  return (
    <section className="relative -mt-1 w-full overflow-hidden bg-gradient-to-b from-[#23429f] via-[#22409a] to-[#22409a] text-white">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-80px] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

      {/* Decorative Lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000">
          <path
            d="M0,500 C200,400 300,600 500,500 C700,400 800,600 1000,500"
            stroke="white"
            fill="transparent"
            strokeWidth="0.5"
          />
          <path
            d="M0,520 C200,420 300,620 500,520 C700,420 800,620 1000,520"
            stroke="white"
            fill="transparent"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 py-16 sm:gap-12 sm:py-20 lg:flex-row lg:gap-16 lg:px-20 lg:py-32">
        {/* LEFT CONTENT */}
        <div className="flex-1 w-full">
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-gradient-to-r from-amber-200/95 via-yellow-100 to-amber-100 px-4 py-2 shadow-[0_10px_24px_rgba(251,191,36,0.32)]">
              <span className="text-sm font-semibold tracking-wide text-[#6b3f00] md:text-base">
                उद्यमेन हि सिद्ध्यन्ति कार्याणि न मनोरथैः
              </span>
              <button
                type="button"
                onClick={() => setShowShlokMeaning((prev) => !prev)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-300 bg-white/70 text-[#7b4a00] transition hover:bg-white"
                aria-label={t("showShlokMeaning", "Show Sanskrit shloka meaning")}
                title={t("showShlokMeaning", "Show Sanskrit shloka meaning")}
              >
                <Info size={14} />
              </button>
            </div>
            {showShlokMeaning ? (
              <p className="mt-2 max-w-xl text-sm font-medium text-amber-100">
                {t(
                  "heroShlokMeaning",
                  "Efforts and action bring success; dreams alone do not build progress.",
                )}
              </p>
            ) : null}
          </div>
          <h1 className="mb-5 text-4xl font-bold leading-tight md:text-5xl lg:mb-6 lg:text-6xl">
            {t("heroTitle", "India’s Digital Platform for Jobs & Workers")}
          </h1>

          <p className="mb-8 max-w-xl text-lg text-blue-100 md:mb-10 md:text-xl">
            {t(
              "heroSubtitle",
              "Apna Rojgar connects workers, contractors, and businesses across India. Find reliable jobs or hire skilled workers quickly through our simple digital platform.",
            )}
          </p>

          {/* CTA Buttons */}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4">
            <a
              target="_blank"
              href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-[#22409a] shadow-lg transition hover:scale-105 sm:w-auto"
            >
              <Download size={20} />
              {t("installApp", "Install App")}
            </a>

            <button
              type="button"
              onClick={handleGetWorkClick}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 px-8 py-4 font-medium transition hover:bg-white/10 sm:w-auto"
            >
              {t("getWorkWithoutApp", "Get Work Without App")}
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4 text-blue-100 sm:mt-12 sm:gap-6">
            <div>
              <p className="text-3xl font-bold text-white sm:text-4xl">{formattedStats.totalUsers}</p>
              <p className="text-sm">{t("totalUsers", "Total Users")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white sm:text-4xl">{formattedStats.totalServices}</p>
              <p className="text-sm">{t("totalServices", "Total Services")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white sm:text-4xl">{formattedStats.totalCities}</p>
              <p className="text-sm">{t("totalCities", "Total Cities")}</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div className="hidden w-full flex-1 justify-center lg:flex">
          <div className="relative">
            {/* Phone Frame */}
            <div className="bg-white/10 backdrop-blur-lg p-4 rounded-3xl shadow-2xl">
              <div className="relative bg-[#c4deff] w-[260px] h-[520px] rounded-2xl flex items-center justify-center">
                <Image
                  src={LOGO}
                  alt={t("apnaRojgarLogoAlt", "Apna Rojgar Logo")}
                  width={120}
                  height={120}
                  className="object-contain rounded-full"
                  priority
                />
              </div>
            </div>

            {/* Floating Decorative Elements */}
            <div className="absolute -top-6 -left-6 w-16 h-16 bg-yellow-400 rounded-full blur-xl opacity-70"></div>
            <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-blue-400 rounded-full blur-xl opacity-70"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
