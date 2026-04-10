"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function About() {
  const { t } = useLanguage();
  return (
    <section id="about" className="py-16">
      <div className="max-w-4xl mx-auto text-center px-6">

        <h2 className="text-3xl font-bold mb-6">{t("aboutTitle", "About Apna Rojgar")}</h2>

        <p className="text-gray-600">
          {t(
            "aboutShort",
            "Apna Rojgar is a digital platform designed to connect workers and employers easily. Our goal is to simplify job discovery and make employment opportunities accessible for everyone.",
          )}
        </p>

      </div>
    </section>
  );
}