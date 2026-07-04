import { useCallback, useEffect, useRef } from "react";
import {
  CFErrorResponse,
  CFPaymentGatewayService,
} from "react-native-cashfree-pg-sdk";
import { CFEnvironment, CFSession } from "cashfree-pg-api-contract";
import { useQueryClient } from "@tanstack/react-query";
import PAYMENT from "@/app/api/payment";
import TOAST from "@/app/hooks/toast";
import { invalidateAndRefetchServiceLists } from "@/utils/invalidateServiceQueries";
import { t } from "@/utils/translationHelper";

const getCashfreeEnvironment = () => {
  const env = (process.env.EXPO_PUBLIC_CASHFREE_ENV || "SANDBOX").toUpperCase();
  return env === "PRODUCTION"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;
};

const getCashfreeErrorMessage = (error: CFErrorResponse) => {
  const raw =
    error?.message ||
    (typeof error === "object" ? JSON.stringify(error) : "") ||
    "";

  if (
    raw.includes("not a trusted source") ||
    raw.includes("installer_package_not_approved") ||
    raw.includes("play store")
  ) {
    return t("promotionPaymentPlayStoreRequired");
  }

  if (
    raw.includes("authentication failed") ||
    raw.includes("Cashfree authentication failed") ||
    raw.includes("config mismatch")
  ) {
    return t("promotionPaymentAuthFailed");
  }

  return raw || t("promotionPaymentFailed");
};

export const useCashfreePromotionPayment = () => {
  const queryClient = useQueryClient();
  const verifyResolverRef = useRef<((orderId: string) => void) | null>(null);
  const rejectResolverRef = useRef<((error: Error) => void) | null>(null);

  useEffect(() => {
    CFPaymentGatewayService.setCallback({
      onVerify: (orderID: string) => {
        verifyResolverRef.current?.(orderID);
      },
      onError: (error: CFErrorResponse, orderID: string) => {
        rejectResolverRef.current?.(new Error(getCashfreeErrorMessage(error)));
      },
    });

    return () => {
      CFPaymentGatewayService.removeCallback();
    };
  }, []);

  const refreshServiceLists = useCallback(
    async (serviceId?: string) => {
      await invalidateAndRefetchServiceLists(queryClient, serviceId);
    },
    [queryClient],
  );

  const startPromotionPayment = useCallback(async (serviceId?: string) => {
    const order = await PAYMENT.createPromotionOrder(serviceId);

    if (order.devBypass) {
      await PAYMENT.verifyPromotionPayment(order.orderId);
      await refreshServiceLists(serviceId);
      return order.orderId;
    }

    await new Promise<void>((resolve, reject) => {
      verifyResolverRef.current = async (orderId: string) => {
        try {
          verifyResolverRef.current = null;
          rejectResolverRef.current = null;

          await PAYMENT.verifyPromotionPayment(orderId);
          await refreshServiceLists(serviceId);
          resolve();
        } catch (error: any) {
          reject(
            error instanceof Error
              ? error
              : new Error(error?.message || t("promotionPaymentFailed")),
          );
        }
      };

      rejectResolverRef.current = (error: Error) => {
        verifyResolverRef.current = null;
        rejectResolverRef.current = null;
        reject(error);
      };

      try {
        const session = new CFSession(
          order.paymentSessionId,
          order.orderId,
          getCashfreeEnvironment(),
        );
        CFPaymentGatewayService.doWebPayment(session);
      } catch (error: any) {
        verifyResolverRef.current = null;
        rejectResolverRef.current = null;
        reject(
          error instanceof Error
            ? error
            : new Error(error?.message || t("promotionPaymentFailed")),
        );
      }
    });

    return order.orderId;
  }, [refreshServiceLists]);

  const runPromotionPayment = useCallback(async (serviceId?: string) => {
    try {
      return await startPromotionPayment(serviceId);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "";
      const friendlyMessage = getCashfreeErrorMessage({
        message,
      } as CFErrorResponse);
      TOAST.error(friendlyMessage || t("promotionPaymentFailed"));
      throw error;
    }
  }, [startPromotionPayment]);

  return { runPromotionPayment };
};
