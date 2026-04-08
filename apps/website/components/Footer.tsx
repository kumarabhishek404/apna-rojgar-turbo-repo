"use client";

import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#22409a] text-white pt-20 pb-10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-80px] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-20 relative z-10">
        {/* Top Grid */}
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Apna Rojgar</h3>

            <p className="text-blue-100 text-sm leading-relaxed">
              Connecting workers and employers across India through a modern
              digital employment platform built for the future of work.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>

            <ul className="space-y-2 text-blue-100 text-sm">
              <li>
                <a href="/" className="hover:text-white transition">
                  About
                </a>
              </li>

              <li>
                <a href="#investor" className="hover:text-white transition">
                  Investors
                </a>
              </li>

              <li>
                <a href="#why" className="hover:text-white transition">
                  Features
                </a>
              </li>

              <li>
                <a href="#contact" className="hover:text-white transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>

            <ul className="space-y-3 text-blue-100 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={16} />
                info@apnarojgarindia.com
              </li>

              <li className="flex items-center gap-2">
                <Phone size={16} />
                +91 6397308499
              </li>

              <li className="flex items-center gap-2">
                <MapPin size={16} />
                Jalesar, Etah Uttar Predesh, India, 207302
              </li>
            </ul>
          </div>

          {/* App Download */}
          <div>
            <h4 className="font-semibold mb-4">Get the App</h4>

            <p className="text-blue-100 text-sm mb-5">
              Find jobs or hire workers directly from your phone.
            </p>

            <a
              target="_blank"
              href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
              className="inline-block bg-white text-[#22409a] px-6 py-3 rounded-xl font-semibold text-sm shadow-lg hover:scale-105 transition"
            >
              Download Android App
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center text-blue-100 text-sm">
          <p>© 2025 Apna Rojgar India. All rights reserved.</p>

          <div className="flex gap-6 mt-3 md:mt-0">
            <a
              target="_blank"
              href="https://kumarabhishek404.github.io/labour-app-pages/privacy-policy.html"
              className="hover:text-white"
            >
              Privacy Policy
            </a>

            <a
              target="_blank"
              href="https://kumarabhishek404.github.io/labour-app-pages/privacy-policy.html"
              className="hover:text-white"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
