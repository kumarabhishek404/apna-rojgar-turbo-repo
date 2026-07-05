"use client";

import { useCallback } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import {
  createPromotionOrder,
  verifyPromotionPayment,
} from "@/lib/payment";

const getCashfreeMode = (environment?: string) => {
  const env = (
    environment ||
    process.env.NEXT_PUBLIC_CASHFREE_ENV ||
    "SANDBOX"
  ).toUpperCase();
  return env === "PRODUCTION" ? "production" : "sandbox";
};

const getFriendlyError = (message: string) => {
  const raw = message || "";
  if (
    raw.includes("token is not present") ||
    raw.includes("order_token_invalid") ||
    raw.includes("payment_session_id is not present") ||
    raw.includes("payment_session_id_invalid")
  ) {
    return "Payment session could not be opened. The app and server Cashfree environments must match (both sandbox or both production).";
  }
  if (
    raw.includes("authentication failed") ||
    raw.includes("Cashfree authentication failed") ||
    raw.includes("config mismatch")
  ) {
    return "Cashfree authentication failed. Use Sandbox API keys when testing locally, or Production keys on the live site.";
  }
  return raw || "Promotion payment failed. Please try again.";
};

export function useCashfreePromotionPayment() {
  const startPromotionPayment = useCallback(async (serviceId?: string) => {
    const order = await createPromotionOrder(serviceId);

    const cashfree = await load({ mode: getCashfreeMode(order.environment) });

    await new Promise<void>((resolve, reject) => {
      cashfree
        .checkout({
          paymentSessionId: order.paymentSessionId,
          redirectTarget: "_modal",
        })
        .then(async (result: { error?: { message?: string } }) => {
          if (result?.error) {
            reject(
              new Error(
                getFriendlyError(
                  result.error.message || "Promotion payment failed",
                ),
              ),
            );
            return;
          }

          try {
            await verifyPromotionPayment(order.orderId);
            resolve();
          } catch (error) {
            reject(
              error instanceof Error
                ? error
                : new Error("Failed to verify promotion payment"),
            );
          }
        })
        .catch((error: unknown) => {
          reject(
            error instanceof Error
              ? new Error(getFriendlyError(error.message))
              : new Error("Promotion payment failed. Please try again."),
          );
        });
    });

    return order.orderId;
  }, []);

  const runPromotionPayment = useCallback(
    async (serviceId?: string) => {
      try {
        return await startPromotionPayment(serviceId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Promotion payment failed";
        throw new Error(getFriendlyError(message));
      }
    },
    [startPromotionPayment],
  );

  return { runPromotionPayment };
}
