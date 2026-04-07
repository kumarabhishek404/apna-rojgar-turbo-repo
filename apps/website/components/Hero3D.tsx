"use client";

import { motion } from "framer-motion";

export default function Hero3D() {
  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-5xl font-bold text-primary mb-6">
            Connecting Workers with Opportunities
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Apna Rojgar helps workers find jobs and businesses hire reliable
            workforce easily.
          </p>

          <a
            target="_blank"
            href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
            className="bg-primary text-white px-8 py-4 rounded-xl shadow-lg"
          >
            Install App
          </a>
        </motion.div>

        <motion.img
          src="/phone-mockup.png"
          className="mx-auto w-[320px]"
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ duration: 1 }}
        />
      </div>
    </section>
  );
}
