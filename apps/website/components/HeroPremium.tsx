"use client";

import { motion } from "framer-motion";

export default function HeroPremium() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl font-bold text-primary mb-6">
            Connecting Workers
            <br />
            with Opportunities
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Apna Rojgar helps workers find jobs and businesses hire trusted
            workforce instantly.
          </p>

          <div className="flex gap-4">
            <a
              target="_blank"
              href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
              className="bg-primary text-white px-8 py-4 rounded-xl shadow-xl"
            >
              Install App
            </a>

            <a
              href="#how"
              className="border border-primary px-8 py-4 rounded-xl"
            >
              How it Works
            </a>
          </div>
        </motion.div>

        <motion.img
          src="/phone.png"
          className="mx-auto w-[320px]"
          initial={{ y: 40, rotate: -6 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{ duration: 1 }}
        />
      </div>
    </section>
  );
}
