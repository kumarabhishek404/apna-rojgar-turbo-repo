"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function GlobalCopyright() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/80 bg-white/90 px-4 py-3 text-center text-xs text-slate-600 backdrop-blur">
      <p>
        {"\u00a9"} {year} {t("apnaRojgarIndia", "Apna Rojgar India")}.{" "}
        {t("allRightsReserved", "All rights reserved.")}
      </p>
    </footer>
  );
}
