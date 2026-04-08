"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import LOGO from "../public/logo.png";
import { useLanguage } from "@/components/LanguageProvider";
import { clearAuth, getAuth, loginUser, saveAuth, validateStoredToken } from "@/lib/auth";

const Navbar = () => {
  const { t, language, setLanguage } = useLanguage();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const auth = getAuth();
      if (!auth?.token) {
        if (active) setIsLoggedIn(false);
        return;
      }
      const valid = await validateStoredToken();
      if (active) setIsLoggedIn(valid);
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("login") !== "1") return;
    setShowLoginModal(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const showLoginButton = !isLoggedIn;

  const menuItems = [{ name: t("about"), link: "/about" }];

  const webAppItems = isLoggedIn ? [{ name: t("allServices"), link: "/all-services" }] : [];
  const openLoginModal = () => {
    setAuthError("");
    setAuthMessage("");
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setMobile("");
    setOtp("");
    setOtpSent(false);
    setAuthError("");
    setAuthMessage("");
  };

  const requestOtp = async () => {
    setAuthError("");
    setAuthMessage("");
    if (!mobile.trim()) {
      setAuthError("Please enter your mobile number.");
      return;
    }
    setAuthLoading(true);
    try {
      const response = await loginUser({ mobile: mobile.trim() });
      setOtpSent(true);
      setAuthMessage(response?.message || "OTP sent successfully");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Failed to send OTP");
    } finally {
      setAuthLoading(false);
    }
  };

  const verifyOtp = async () => {
    setAuthError("");
    setAuthMessage("");
    if (!otp.trim()) {
      setAuthError("Please enter OTP.");
      return;
    }
    setAuthLoading(true);
    try {
      const response = await loginUser({ mobile: mobile.trim(), otp: otp.trim() });
      saveAuth({ user: response?.user, token: response?.token });
      setIsLoggedIn(true);
      closeLoginModal();
      window.location.href = "/";
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "OTP verification failed");
    } finally {
      setAuthLoading(false);
    }
  };


  const profileMenuItems = [
    { name: t("myProfile"), link: "/my-profile" },
    { name: "Settings", link: "/settings" },
  ];

  return (
    <>
      <nav
        className={`w-full py-4 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-[#22409a]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
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
          <Link
            target="_blank"
            href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
            className={`hidden sm:inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-300 ${
              scrolled
                ? "text-[#22409a] hover:bg-[#22409a]/10"
                : "text-white hover:bg-white/15"
            } animate-pulse`}
          >
            Install App
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-10">
          <ul
            className={`flex items-center gap-8 font-medium ${
              scrolled ? "text-gray-700" : "text-white"
            }`}
          >
            {[...menuItems, ...webAppItems].map((item, i) => (
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
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "hi")}
              className="rounded-lg border border-white/20 bg-white/10 px-2 py-2 text-sm text-white"
            >
              <option value="en" className="text-black">
                {t("english")}
              </option>
              <option value="hi" className="text-black">
                {t("hindi")}
              </option>
            </select>
            {showLoginButton ? (
              <button
                type="button"
                onClick={openLoginModal}
                className="bg-[#FFE492] hover:bg-[#ffd966] text-[#043873] px-6 py-2.5 rounded-lg font-bold transition"
              >
                {t("login")}
              </button>
            ) : null}
            <div className="relative">
              {isLoggedIn ? (
              <button
                onClick={() => setDesktopMenuOpen((prev) => !prev)}
                className={`rounded-lg p-2 ${scrolled ? "text-[#22409a]" : "text-white"} hover:bg-black/10`}
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
              ) : null}
              {desktopMenuOpen ? (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                  {profileMenuItems.map((item) => (
                    <Link
                      key={item.link}
                      href={item.link}
                      onClick={() => setDesktopMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      clearAuth();
                      setIsLoggedIn(false);
                      setDesktopMenuOpen(false);
                      window.location.href = "/";
                    }}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    {t("logout")}
                  </button>
                </div>
              ) : null}
            </div>
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
              {[...menuItems, ...webAppItems].map((item, i) => (
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
                  href="/my-profile"
                  onClick={() => setMenuOpen(false)}
                  className="text-lg font-medium text-gray-700 hover:text-[#22409a]"
                >
                  {t("myProfile")}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="text-lg font-medium text-gray-700 hover:text-[#22409a]"
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    clearAuth();
                    setMenuOpen(false);
                    setIsLoggedIn(false);
                    window.location.href = "/";
                  }}
                  className="text-left text-lg font-medium text-red-600 hover:text-red-700"
                >
                  {t("logout")}
                </button>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "hi")}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <option value="en">{t("english")}</option>
                  <option value="hi">{t("hindi")}</option>
                </select>
                {showLoginButton ? (
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="bg-[#FFE492] text-center text-[#043873] py-3 rounded-lg font-bold"
                  >
                    {t("login")}
                  </button>
                ) : null}

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

      {showLoginModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#16264f]">{t("login")}</h3>
              <button
                type="button"
                onClick={closeLoginModal}
                className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mobile Number</label>
                <input
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value)}
                  inputMode="numeric"
                  placeholder="Enter mobile number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#22409a] focus:outline-none"
                  disabled={otpSent}
                />
              </div>
              {otpSent ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">OTP</label>
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    inputMode="numeric"
                    placeholder="Enter OTP"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#22409a] focus:outline-none"
                  />
                </div>
              ) : null}
              {authError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p>
              ) : null}
              {authMessage ? (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{authMessage}</p>
              ) : null}
              {!otpSent ? (
                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={authLoading}
                  className="w-full rounded-lg bg-[#22409a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#1b357f] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {authLoading ? "Sending OTP..." : "Send OTP"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={authLoading}
                  className="w-full rounded-lg bg-[#22409a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#1b357f] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {authLoading ? "Verifying..." : "Verify OTP & Login"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Navbar;
