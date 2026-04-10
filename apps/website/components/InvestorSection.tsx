"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, Globe } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import ShlokBadge from "@/components/ShlokBadge";

export default function Investors() {
  const { t } = useLanguage();
  const points = [
    {
      icon: Users,
      title: t("investGrowingUsersTitle", "Growing Users"),
      desc: t(
        "investGrowingUsersDesc",
        "A rapidly expanding network of workers and employers joining Apna Rojgar across India.",
      ),
    },
    {
      icon: TrendingUp,
      title: t("investMassiveMarketTitle", "Massive Market"),
      desc: t(
        "investMassiveMarketDesc",
        "India's labour and workforce market represents millions of daily job opportunities.",
      ),
    },
    {
      icon: Globe,
      title: t("investBigVisionTitle", "Big Vision"),
      desc: t(
        "investBigVisionDesc",
        "Building the digital infrastructure that powers employment for India's workforce.",
      ),
    },
  ];

  return (
    <section id="investor" className="py-24 bg-[#22409a] text-white relative overflow-hidden">
      
      {/* Glow Background */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-80px] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-20 text-center relative z-10">
        <ShlokBadge
          text="श्रद्धावान् लभते ज्ञानं तत्परः संयतेन्द्रियः॥"
          meaningKey="investorShlokMeaning"
          meaningDefault="With faith, focus, and self-discipline, wisdom and long-term growth become achievable."
          align="center"
          className="mb-5"
        />
        <h2 className="text-4xl lg:text-5xl font-bold mb-6">
          {t("investInApnaRojgarTitle", "Invest in Apna Rojgar")}
        </h2>

        <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-16">
          {t(
            "investInApnaRojgarSubtitle",
            "We are building India&apos;s digital infrastructure for employment — connecting workers, businesses, and opportunities at scale.",
          )}
        </p>

        <div className="grid md:grid-cols-3 gap-10">
          {points.map((item, i) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-14 h-14 flex items-center justify-center bg-white text-[#22409a] rounded-xl">
                    <Icon size={28} />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3">
                  {item.title}
                </h3>

                <p className="text-blue-100 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16">
          <a
            target="_blank"
            href="https://forms.gle/KK5C46mxdMehFR9s5"
            className="inline-block bg-white text-[#22409a] px-8 py-4 rounded-xl font-semibold shadow-lg hover:scale-105 transition"
          >
            {t("becomeInvestor", "Become an Investor")}
          </a>
        </div>

      </div>
    </section>
  );
}