"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { registerUser, saveAuth } from "@/lib/auth";

export default function RegisterPage() {
  const [mobile, setMobile] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [locale, setLocale] = useState("en");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{10}$/.test(mobile.trim())) {
      setError("Please enter a valid 10 digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser({
        mobile: mobile.trim(),
        countryCode: countryCode.trim(),
        locale: locale.trim(),
      });

      saveAuth(response?.data || {});
      setMessage("Registration successful. You can now continue from web.");
      window.location.href = "/my-profile";
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[#22409a]">Create Account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Register on website using the same backend as mobile app.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Country Code
            </label>
            <input
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#22409a] focus:outline-none"
              placeholder="+91"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mobile Number
            </label>
            <input
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#22409a] focus:outline-none"
              placeholder="10 digit mobile"
              inputMode="numeric"
              maxLength={10}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Locale
            </label>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#22409a] focus:outline-none"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          {message ? (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#22409a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#1b357f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-5 text-sm text-gray-600">
          Already registered?{" "}
          <Link href="/?login=1" className="font-semibold text-[#22409a] hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </main>
  );
}
