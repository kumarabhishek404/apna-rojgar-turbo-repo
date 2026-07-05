import { CFEnvironment } from "cashfree-pg-api-contract";

/** Map backend / config env string to Cashfree SDK environment. */
export const resolveCashfreeEnvironment = (
  env?: string | null,
): CFEnvironment => {
  const normalized = (
    env ||
    process.env.EXPO_PUBLIC_CASHFREE_ENV ||
    "SANDBOX"
  )
    .trim()
    .toLowerCase();

  return normalized === "production"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;
};
