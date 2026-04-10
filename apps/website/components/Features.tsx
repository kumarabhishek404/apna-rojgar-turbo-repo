"use client";

import { motion } from "framer-motion";
import { Briefcase, Users, MessageSquare, MapPin } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import ShlokBadge from "@/components/ShlokBadge";

export default function Features() {
  const { t } = useLanguage();
  const features = [
    {
      icon: Briefcase,
      title: t("featureEasyJobDiscoveryTitle", "Easy Job Discovery"),
      desc: t(
        "featureEasyJobDiscoveryDesc",
        "Workers can quickly find nearby job opportunities that match their skills and availability.",
      ),
    },
    {
      icon: Users,
      title: t("featureConnectWorkersEmployersTitle", "Connect Workers & Employers"),
      desc: t(
        "featureConnectWorkersEmployersDesc",
        "Businesses and workers can connect directly without complicated hiring processes.",
      ),
    },
    {
      icon: MessageSquare,
      title: t("featureFastCommunicationTitle", "Fast Communication"),
      desc: t(
        "featureFastCommunicationDesc",
        "Built-in communication tools allow employers and workers to coordinate easily.",
      ),
    },
    {
      icon: MapPin,
      title: t("featureLocalOpportunitiesTitle", "Local Opportunities"),
      desc: t(
        "featureLocalOpportunitiesDesc",
        "Find jobs and workers within your local area to reduce travel time and increase efficiency.",
      ),
    }
  ];

  return (
    <section
      id="why"
      className="w-full py-24 bg-[#22409a] text-white relative overflow-hidden"
    >
      {/* Decorative background circles */}
      <div className="absolute opacity-10 -top-32 -left-32 w-96 h-96 rounded-full bg-white blur-3xl"></div>
      <div className="absolute opacity-10 bottom-[-120px] right-[-80px] w-96 h-96 rounded-full bg-white blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-20 text-center relative z-10">
        <ShlokBadge
          text="परस्परं भावयन्तः श्रेयः परमवाप्स्यथ॥"
          meaningKey="whyShlokMeaning"
          meaningDefault="By uplifting one another through cooperation, everyone reaches higher wellbeing and success."
          align="center"
          className="mb-5"
        />
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-4xl lg:text-5xl font-bold mb-6"
        >
          {t("whyApnaRojgarTitle", "Why Apna Rojgar?")}
        </motion.h2>

        <p className="max-w-2xl mx-auto text-blue-100 mb-16 text-lg">
          {t(
            "whyApnaRojgarSubtitle",
            "Apna Rojgar simplifies the way workers and employers connect. Our platform empowers people with opportunities while helping businesses build reliable teams faster.",
          )}
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl text-left hover:bg-white/20 transition-all duration-300"
              >
                <div className="mb-5 w-12 h-12 flex items-center justify-center bg-white text-[#22409a] rounded-lg">
                  <Icon size={24} />
                </div>

                <h3 className="text-xl font-semibold mb-3">
                  {feature.title}
                </h3>

                <p className="text-blue-100 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}