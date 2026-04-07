"use client";

import { ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import LOGO from "../public/logo.png";

const HeroSection = () => {
  return (
    <section className="relative w-full bg-[#22409a] text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-80px] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

      {/* Decorative Lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000">
          <path
            d="M0,500 C200,400 300,600 500,500 C700,400 800,600 1000,500"
            stroke="white"
            fill="transparent"
            strokeWidth="0.5"
          />
          <path
            d="M0,520 C200,420 300,620 500,520 C700,420 800,620 1000,520"
            stroke="white"
            fill="transparent"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24 lg:py-32 flex flex-col lg:flex-row items-center gap-16 relative z-10">
        {/* LEFT CONTENT */}
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            India’s Digital Platform for Jobs & Workers
          </h1>

          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-xl">
            Apna Rojgar connects workers, contractors, and businesses across
            India. Find reliable jobs or hire skilled workers quickly through
            our simple digital platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <a
              target="_blank"
              href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
              className="inline-flex items-center gap-2 bg-white text-[#22409a] px-8 py-4 rounded-xl font-semibold shadow-lg hover:scale-105 transition"
            >
              <Download size={20} />
              Install App
            </a>

            <Link
              href="/get-work"
              className="inline-flex items-center gap-2 border border-white/40 px-8 py-4 rounded-xl font-medium hover:bg-white/10 transition"
            >
              Get Work Without App
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-10 mt-12 text-blue-100">
            <div>
              <p className="text-3xl font-bold text-white">10K+</p>
              <p className="text-sm">Workers</p>
            </div>

            <div>
              <p className="text-3xl font-bold text-white">2K+</p>
              <p className="text-sm">Employers</p>
            </div>

            <div>
              <p className="text-3xl font-bold text-white">20+</p>
              <p className="text-sm">Cities</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div className="flex-1 w-full flex justify-center">
          <div className="relative">
            {/* Phone Frame */}
            <div className="bg-white/10 backdrop-blur-lg p-4 rounded-3xl shadow-2xl">
              <div className="relative bg-[#c4deff] w-[260px] h-[520px] rounded-2xl flex items-center justify-center">
                <Image
                  src={LOGO}
                  alt="Apna Rojgar Logo"
                  width={120}
                  height={120}
                  className="object-contain rounded-full"
                  priority
                />
              </div>
            </div>

            {/* Floating Decorative Elements */}
            <div className="absolute -top-6 -left-6 w-16 h-16 bg-yellow-400 rounded-full blur-xl opacity-70"></div>
            <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-blue-400 rounded-full blur-xl opacity-70"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
