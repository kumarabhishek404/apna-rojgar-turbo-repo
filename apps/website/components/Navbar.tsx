"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import LOGO from "../public/logo.png";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { name: "About", link: "#about" },
    { name: "Our Mission", link: "#mission" },
    { name: "Our Vision", link: "#vision" },
    { name: "Why Apna Rojgar", link: "#why" },
    { name: "Investor", link: "#investor" },
    { name: "Contact", link: "#contact" },
  ];

  return (
    <>
      <nav
        className={`w-full py-4 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-[#22409a]"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer">
          {/* Logo */}
          <div
            className={`flex items-center justify-center transition-all duration-300 ${
              scrolled ? "w-10 h-10" : "w-11 h-11 bg-white p-1 rounded-md"
            }`}
          >
            <Image
              src={LOGO}
              alt="Apna Rojgar"
              className={`object-contain ${
                scrolled ? "rounded-full" : "rounded-full"
              }`}
              width={32}
              height={32}
              priority
            />
          </div>

          {/* Brand Name */}
          <span
            className={`text-2xl font-bold tracking-tight transition-colors ${
              scrolled ? "text-[#22409a]" : "text-white"
            }`}
          >
            Apna Rojgar
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-10">
          <ul
            className={`flex items-center gap-8 font-medium ${
              scrolled ? "text-gray-700" : "text-white"
            }`}
          >
            {menuItems.map((item, i) => (
              <li key={i}>
                <Link
                  href={item.link}
                  className="hover:text-blue-400 transition"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="bg-[#FFE492] hover:bg-[#ffd966] text-[#043873] px-6 py-2.5 rounded-lg font-bold transition"
            >
              Login
            </Link>

            <Link
              target="_blank"
              href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
              className="flex items-center gap-2 bg-[#4F9CF9] hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition"
            >
              Install App <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden z-50"
        >
          {menuOpen ? (
            <X
              size={28}
              className={scrolled ? "text-[#22409a]" : "text-white"}
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <span
                className={`w-7 h-1 rounded ${
                  scrolled ? "bg-[#22409a]" : "bg-white"
                }`}
              />
              <span
                className={`w-7 h-1 rounded ${
                  scrolled ? "bg-[#22409a]" : "bg-white"
                }`}
              />
              <span
                className={`w-7 h-1 rounded ${
                  scrolled ? "bg-[#22409a]" : "bg-white"
                }`}
              />
            </div>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ y: -300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed top-0 left-0 w-full bg-white shadow-xl z-40"
          >
            <div className="pt-24 pb-10 px-8 flex flex-col gap-6">
              {menuItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.link}
                  onClick={() => setMenuOpen(false)}
                  className="text-lg font-medium text-gray-700 hover:text-[#22409a]"
                >
                  {item.name}
                </Link>
              ))}

              <div className="border-t pt-6 flex flex-col gap-4">
                <Link
                  href="/login"
                  className="bg-[#FFE492] text-center text-[#043873] py-3 rounded-lg font-bold"
                >
                  Login
                </Link>

                <Link
                  target="_blank"
                  href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
                  className="flex justify-center items-center gap-2 bg-[#22409a] text-white py-3 rounded-lg font-semibold"
                >
                  Install App
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
