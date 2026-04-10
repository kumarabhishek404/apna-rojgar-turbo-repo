"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import ShlokBadge from "@/components/ShlokBadge";

export default function DownloadApp() {
  const { t } = useLanguage();
  return (
    <section
      id="download"
      className="py-28 bg-[#22409a] text-white relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-80px] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-20 flex flex-col lg:flex-row items-center gap-16 relative z-10">

        {/* LEFT TEXT */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex-1 text-center lg:text-left"
        >
          <ShlokBadge
            text="उत्तिष्ठत जाग्रत प्राप्य वरान्निबोधत॥"
            meaningKey="downloadShlokMeaning"
            meaningDefault="Rise, awaken, and move forward with purpose until you achieve your best."
            align="centerMobileLeftDesktop"
            className="mb-5"
          />
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            {t("downloadAppTitleLine1", "Download the")} <br /> {t("downloadAppTitleLine2", "Apna Rojgar App")}
          </h2>

          <p className="text-blue-100 mb-10 max-w-lg">
            {t(
              "downloadAppSubtitle",
              "Discover job opportunities, connect with workers, and manage employment easily through the Apna Rojgar mobile app. Start growing your opportunities today.",
            )}
          </p>

          <a
            target="_blank"
            href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
            className="inline-flex items-center gap-3 bg-white text-[#22409a] font-semibold px-8 py-4 rounded-xl shadow-lg hover:scale-105 transition"
          >
            <Download size={20} />
            {t("installAndroidApp", "Install Android App")}
          </a>
        </motion.div>

        {/* RIGHT PHONE MOCKUP */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="flex-1 flex justify-center"
        >
          <div className="relative">

            {/* Phone Glow */}
            <div className="absolute -inset-10 bg-white/20 blur-3xl rounded-full"></div>

            <Image
              src="/screenshots/screenshot1.webp"
              width={320}
              height={640}
              alt={t("apnaRojgarAppAlt", "Apna Rojgar App")}
              className="relative rounded-3xl shadow-2xl border border-white/20"
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}