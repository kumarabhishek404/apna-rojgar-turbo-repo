"use client";

import { UserPlus, Search, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      icon: UserPlus,
      title: "Create Profile",
      desc: "Workers and employers sign up and create their profiles in just a few simple steps.",
    },
    {
      icon: Search,
      title: "Connect & Discover",
      desc: "Businesses find skilled workers while workers discover nearby job opportunities.",
    },
    {
      icon: Briefcase,
      title: "Start Working",
      desc: "Coordinate jobs, communicate easily, and grow opportunities digitally.",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-80px] w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-20 text-center relative z-10">
        <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
          How Apna Rojgar Works
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto mb-16">
          Apna Rojgar makes it simple for workers and employers to connect,
          collaborate, and grow opportunities together.
        </p>

        {/* Timeline */}
        <div className="relative grid md:grid-cols-3 gap-10">
          {/* Horizontal timeline line */}
          <div className="hidden md:block absolute top-10 left-0 right-0 h-[2px] bg-gray-300"></div>

          {steps.map((step, i) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                viewport={{ once: true }}
                className="relative bg-white backdrop-blur-lg border border-gray-200 p-8 rounded-2xl shadow-lg"
              >
                {/* Step Circle */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#22409a] text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                  {i + 1}
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-6 mt-4">
                  <div className="w-14 h-14 flex items-center justify-center bg-blue-100 text-[#22409a] rounded-xl">
                    <Icon size={28} />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {step.title}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}