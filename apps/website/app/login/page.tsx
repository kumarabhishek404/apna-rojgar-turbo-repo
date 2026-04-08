"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { loginUser, saveAuth } from "@/lib/auth";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!mobile.trim()) {
      setError("Please enter your mobile number.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({ mobile: mobile.trim() });
      setOtpSent(true);
      setMessage(response?.message || "OTP sent successfully");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("Please enter OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({ mobile: mobile.trim(), otp: otp.trim() });
      saveAuth({ user: response?.user, token: response?.token });
      setMessage("Login successful. You are now logged in on website.");
      window.location.href = "/all-services";
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[#22409a]">Login</h1>
        <p className="mt-2 text-sm text-gray-600">
          Login with mobile OTP using existing app backend.
        </p>

        {!otpSent ? (
          <form className="mt-6 space-y-4" onSubmit={requestOtp}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <input
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#22409a] focus:outline-none"
                placeholder="Enter mobile number"
                inputMode="numeric"
              />
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
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={verifyOtp}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <input
                value={mobile}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">OTP</label>
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#22409a] focus:outline-none"
                placeholder="Enter OTP"
                inputMode="numeric"
              />
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
              {loading ? "Verifying..." : "Verify OTP & Login"}
            </button>
          </form>
        )}

        <p className="mt-5 text-sm text-gray-600">
          New user?{" "}
          <Link href="/register" className="font-semibold text-[#22409a] hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}
