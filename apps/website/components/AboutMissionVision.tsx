"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import LOGO from "../public/logo.png";
import { useLanguage } from "@/components/LanguageProvider";
import ShlokBadge from "@/components/ShlokBadge";

type PlatformStats = {
  totalUsers: number;
};

const AboutMissionVision = () => {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const base =
          process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apnarojgarindia.com/api/v1";
        const response = await fetch(`${base}/service/public/platform-stats`);
        const json = await response.json();
        if (!response.ok || json?.success === false || !json?.data) return;
        if (!cancelled) {
          setStats({ totalUsers: Number(json.data.totalUsers) || 0 });
        }
      } catch {
        // Keep fallback null state
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalUsersText = useMemo(() => {
    const value = stats?.totalUsers ?? 0;
    return new Intl.NumberFormat(language === "hi" ? "hi-IN" : "en-IN").format(value);
  }, [stats, language]);

  const redirectToApp = () => {
    window.open(
      "https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp",
      "_blank",
    );
  };

  return (
    <div className="w-full bg-white font-sans overflow-hidden">
      {/* SECTION 1: ABOUT APNA ROJGAR */}
      <section
        id="about"
        className="container mx-auto px-6 lg:px-20 py-24 flex flex-col lg:flex-row items-center gap-16 relative"
      >
        {/* Decorative Background */}
        <div className="absolute right-[-5%] top-[5%] opacity-10 pointer-events-none hidden lg:block">
          <svg width="400" height="400" viewBox="0 0 200 200">
            {[...Array(6)].map((_, i) => (
              <circle
                key={i}
                cx="100"
                cy="100"
                r={20 + i * 15}
                fill="none"
                stroke="#22409a"
                strokeWidth="0.5"
              />
            ))}
          </svg>
        </div>

        <div className="flex-1 z-10">
          <ShlokBadge
            text="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन॥"
            meaningKey="aboutShlokMeaning"
            meaningDefault="Focus on your duty with full dedication; the right outcomes follow through sincere action."
            dark
            className="mb-5"
          />
          <div className="relative inline-block mb-6">
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              {t("aboutHeadingLine1", "About")} <br /> {t("aboutHeadingLine2", "Apna Rojgar")}
            </h2>

            <div className="absolute bottom-1 left-0 w-full h-3 bg-[#FFE492] -z-10 opacity-70 translate-y-1"></div>
          </div>

          <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-lg">
            {t(
              "aboutLongP1",
              "Apna Rojgar is a digital initiative aimed at connecting skilled and unskilled workers with businesses, contractors, and employers across India. Our platform simplifies the process of finding work opportunities and hiring reliable workers in sectors like construction, manufacturing, delivery, and services.",
            )}
          </p>

          <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-lg">
            {t(
              "aboutLongP2",
              "By leveraging technology, Apna Rojgar helps workers access better employment opportunities while enabling businesses to find trusted manpower quickly and efficiently.",
            )}
          </p>

          <button
            onClick={redirectToApp}
            className="flex items-center gap-2 bg-[#4F9CF9] hover:bg-blue-600 text-white px-10 py-4 rounded-lg font-medium transition-all shadow-md"
          >
            {t("explorePlatform", "Explore Platform")} <ArrowRight size={18} />
          </button>
        </div>

        <div className="flex-1 relative flex items-center justify-center py-20">
          {/* Gradient Background Blob */}
          <div className="absolute w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-40"></div>

          {/* Main Card */}
          <div className="relative bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 w-64">
            <div className="h-32 bg-[#c4deff] rounded-lg mb-4"></div>
            <p className="text-sm text-gray-600">
              {t("aboutCardMain", "Workers can easily discover nearby job opportunities.")}
            </p>
          </div>

          {/* Floating Card 1 */}
          <div className="absolute -top-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 w-40">
            <div className="h-6 w-6 bg-[#4F9CF9] rounded-full mb-2"></div>
            <p className="text-xs text-gray-600">{t("aboutCardFindJobs", "Find Local Jobs")}</p>
          </div>

          {/* Floating Card 2 */}
          <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 w-40">
            <div className="h-6 w-6 bg-[#50C878] rounded-full mb-2"></div>
            <p className="text-xs text-gray-600">
              {t("aboutCardHireWorkers", "Hire Skilled Workers")}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: OUR MISSION */}
      <section
        id="mission"
        className="container mx-auto px-6 lg:px-20 py-24 flex flex-col-reverse lg:flex-row items-center gap-16 relative"
      >
        {/* Decorative Circles */}
        <div className="absolute left-[-5%] top-[10%] opacity-10 pointer-events-none hidden lg:block">
          <svg width="400" height="400" viewBox="0 0 200 200">
            {[...Array(6)].map((_, i) => (
              <circle
                key={i}
                cx="100"
                cy="100"
                r={20 + i * 15}
                fill="none"
                stroke="#22409a"
                strokeWidth="0.5"
              />
            ))}
          </svg>
        </div>

        {/* IMAGE FIRST */}
        <div className="flex-1 relative flex items-center justify-center py-16">
          {/* Soft Background Glow */}
          <div className="absolute w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-30"></div>

          {/* Main Dashboard Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 p-6 z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
              <div className="h-3 w-10 bg-gray-200 rounded"></div>
            </div>

            {/* Job Growth Bars */}
            <div className="space-y-3">
              <div className="w-full h-3 bg-gray-100 rounded">
                <div className="w-3/4 h-3 bg-[#4F9CF9] rounded"></div>
              </div>

              <div className="w-full h-3 bg-gray-100 rounded">
                <div className="w-1/2 h-3 bg-[#50C878] rounded"></div>
              </div>

              <div className="w-full h-3 bg-gray-100 rounded">
                <div className="w-2/3 h-3 bg-[#FFD966] rounded"></div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 h-3 w-32 bg-gray-200 rounded"></div>
          </div>

          {/* Floating Card - Workers */}
          <div className="absolute -top-6 left-6 bg-white p-3 rounded-xl shadow-lg border border-gray-100">
            <p className="text-xs font-medium text-gray-700">{t("totalUsers", "Total Users")}</p>
            <p className="text-sm font-bold text-[#22409a]">{totalUsersText}</p>
          </div>

          {/* Floating Card - Jobs */}
          <div className="absolute -bottom-6 right-6 bg-white p-3 rounded-xl shadow-lg border border-gray-100">
            <p className="text-xs font-medium text-gray-700">{t("jobs", "Jobs")}</p>
            <p className="text-sm font-bold text-[#50C878]">{t("dailyUpdates", "Daily Updates")}</p>
          </div>
        </div>

        {/* TEXT SECOND */}
        <div className="flex-1 z-10">
          <ShlokBadge
            text="संगच्छध्वं संवदध्वं सं वो मनांसि जानताम्॥"
            meaningKey="missionShlokMeaning"
            meaningDefault="Move together, speak together, and align your minds for a shared purpose and progress."
            dark
            className="mb-5"
          />
          <div className="relative inline-block mb-6">
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              {t("missionHeadingLine1", "Our")} <br /> {t("missionHeadingLine2", "Mission")}
            </h2>

            <div className="absolute bottom-1 left-0 w-full h-3 bg-[#FFE492] -z-10 opacity-70 translate-y-1"></div>
          </div>

          <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-lg">
            {t(
              "missionP1",
              "Our mission is to bridge the gap between job seekers and employers by creating a transparent, reliable, and accessible digital ecosystem for employment in India.",
            )}
          </p>

          <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-lg">
            {t(
              "missionP2",
              "Apna Rojgar aims to empower millions of workers by providing them with direct access to job opportunities while helping businesses find the right workforce quickly and efficiently.",
            )}
          </p>

          <button
            onClick={redirectToApp}
            className="flex items-center gap-2 bg-[#4F9CF9] hover:bg-blue-600 text-white px-10 py-4 rounded-lg font-medium transition-all shadow-md"
          >
            {t("joinMission", "Join the Mission")} <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* SECTION 3: OUR VISION */}
      <section
        id="vision"
        className="container mx-auto px-6 lg:px-20 py-24 flex flex-col lg:flex-row items-center gap-20"
      >
        {/* Orbital Graphic */}
        <div className="flex-1">
          <ShlokBadge
            text="तमसो मा ज्योतिर्गमय॥"
            meaningKey="visionShlokMeaning"
            meaningDefault="Lead us from darkness to light, from confusion to clarity, and towards a better future."
            dark
            className="mb-5"
          />
          <div className="relative inline-block mb-6">
            <h2 className="text-5xl lg:text-6xl font-bold text-gray-900">
              {t("visionTitle", "Our Vision")}
            </h2>

            <div className="absolute bottom-1 left-0 w-full h-3 bg-[#FFE492] -z-10 opacity-70 translate-y-1"></div>
          </div>

          <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-lg">
            {t(
              "visionP1",
              "Our vision is to become India’s most trusted digital employment platform that empowers workers and businesses alike.",
            )}
          </p>

          <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-lg">
            {t(
              "visionP2",
              "Apna Rojgar aims to create a future where finding work or hiring skilled manpower is fast, transparent, and accessible to everyone, regardless of location or background.",
            )}
          </p>

          <button
            onClick={redirectToApp}
            className="flex items-center gap-2 bg-[#4F9CF9] hover:bg-blue-600 text-white px-10 py-4 rounded-lg font-medium transition-all shadow-md"
          >
            {t("discoverVision", "Discover the Vision")} <ArrowRight size={18} />
          </button>
        </div>

        <div className="flex-1 relative flex items-center justify-center py-16 lg:py-20">
          {/* Orbit Circles */}
          <div className="absolute w-40 h-40 lg:w-48 lg:h-48 border border-dashed border-blue-200 rounded-full" />
          <div className="absolute w-64 h-64 lg:w-80 lg:h-80 border border-dashed border-blue-200 rounded-full" />

          {/* Center Logo Card */}
          <div className="relative z-10 shadow-xl rounded-full border border-gray-100">
            <Image
              src={LOGO}
              alt={t("apnaRojgarLogoAlt", "Apna Rojgar Logo")}
              width={120}
              height={120}
              className="object-contain rounded-full"
              priority
            />
          </div>

          {/* Floating Elements */}
          <div className="absolute top-6 lg:top-10 left-1/2 -translate-x-1/2 w-6 h-6 lg:w-10 lg:h-10 bg-[#FFD966] rounded-full" />

          <div className="absolute top-1/4 right-4 lg:right-10 w-8 h-8 lg:w-12 lg:h-12 bg-[#4F9CF9] rounded-full" />

          <div className="absolute bottom-1/4 left-4 lg:left-0 w-7 h-7 lg:w-10 lg:h-10 bg-[#F06292] rounded-full opacity-80" />

          <div className="absolute bottom-4 right-1/4 w-7 h-7 lg:w-10 lg:h-10 bg-[#50C878] rounded-full" />

          <div className="absolute top-1/2 right-0 lg:-right-4 w-5 h-5 lg:w-8 lg:h-8 bg-[#4F9CF9] rounded-full" />
        </div>
      </section>
    </div>
  );
};

export default AboutMissionVision;
