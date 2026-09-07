/**
 * Shared runtime flags — keep startup logs and auth/payment behavior in sync.
 */

const truthy = (value) =>
  ["1", "true", "yes"].includes(String(value ?? "").toLowerCase().trim());

const falsy = (value) =>
  ["0", "false", "no"].includes(String(value ?? "").toLowerCase().trim());

/** Same rules as auth.controller `isDevOtpBypassEnabled`. */
export function isDevOtpBypassEnabled() {
  if (truthy(process.env.OTP_FORCE_LIVE)) return false;
  if (process.env.NODE_ENV !== "development") return false;

  const raw = process.env.DEV_BYPASS_OTP ?? process.env.SKIP_OTP ?? "";
  if (falsy(raw)) return false;
  if (truthy(raw)) return true;
  return true;
}

export function getCashfreeEnvLabel() {
  return (process.env.CASHFREE_ENV || "sandbox").toLowerCase().trim();
}

export function logRuntimeMode(port) {
  const otpLabel = isDevOtpBypassEnabled()
    ? "DEV BYPASS (any 6-digit code)"
    : "live 2factor SMS";
  const cashfree = getCashfreeEnvLabel();

  const twoFactorKey = String(process.env.TWOFACTOR_API_KEY || "").trim();
  const twoFactorLabel = twoFactorKey
    ? `2factor key set (${twoFactorKey.length} chars)`
    : "TWOFACTOR_API_KEY missing";

  console.log(`🚀 API running on port ${port} in ${process.env.NODE_ENV} mode`);
  console.log(`🔐 OTP: ${otpLabel} | ${twoFactorLabel} | Cashfree: ${cashfree}`);

  if (process.env.NODE_ENV === "production" && !twoFactorKey) {
    console.error(
      "❌ TWOFACTOR_API_KEY is empty in production. Login OTP will fail until the live 2factor.in key is set in .env.production.",
    );
  }

  if (process.env.NODE_ENV === "production" && isDevOtpBypassEnabled()) {
    console.error(
      "❌ Refusing inconsistent state: production with OTP bypass. Check .env.production.",
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    cashfree !== "production" &&
    !truthy(process.env.CASHFREE_FORCE_LIVE)
  ) {
    console.warn(
      "⚠️ Production is not using Cashfree live mode (set CASHFREE_ENV=production in .env.production).",
    );
  }
}
