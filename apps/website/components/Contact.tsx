"use client";

import { Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import ShlokBadge from "@/components/ShlokBadge";

export default function Contact() {
  const { t } = useLanguage();
  return (
    <section
      id="contact"
      className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden"
    >
      {/* soft background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-80px] w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>

      <div className="max-w-6xl mx-auto px-6 lg:px-20 text-center relative z-10">
        <ShlokBadge
          text="संगच्छध्वं संवदध्वं सं वो मनांसि जानताम्॥"
          meaningKey="contactShlokMeaning"
          meaningDefault="Come together, communicate openly, and build shared understanding."
          align="center"
          dark
          className="mb-5"
        />
        <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
          {t("contactUs", "Contact Us")}
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto mb-14">
          {t(
            "contactSubtitle",
            "Have questions, partnership ideas, or investor inquiries? Our team is always happy to connect and help.",
          )}
        </p>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white border border-gray-200 p-8 rounded-2xl shadow-lg"
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-[#22409a] rounded-xl">
                <Mail size={22} />
              </div>
            </div>

            <h3 className="font-semibold mb-2 text-gray-900">{t("email", "Email")}</h3>
            <p className="text-gray-600 text-sm">info@apnarojgarindia.com</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white border border-gray-200 p-8 rounded-2xl shadow-lg"
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-[#22409a] rounded-xl">
                <Phone size={22} />
              </div>
            </div>

            <h3 className="font-semibold mb-2 text-gray-900">{t("phone", "Phone")}</h3>
            <p className="text-gray-600 text-sm">+91 6397308499</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white border border-gray-200 p-8 rounded-2xl shadow-lg"
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-[#22409a] rounded-xl">
                <MapPin size={22} />
              </div>
            </div>

            <h3 className="font-semibold mb-2 text-gray-900">{t("location", "Location")}</h3>
            <p className="text-gray-600 text-sm">
              Jalesar, Etah Uttar Predesh India, 207302
            </p>
          </motion.div>
        </div>

        {/* CTA */}
        <div className="mt-16">
          <a
            href="mailto:info@apnarojgarindia.com"
            className="inline-block bg-[#22409a] text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:scale-105 transition"
          >
            {t("sendEmail", "Send Email")}
          </a>
        </div>
      </div>
    </section>
  );
}
