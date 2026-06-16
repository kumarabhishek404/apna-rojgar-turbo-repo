import { apiRequest } from "@/lib/auth";

export type PromotionPaymentConfig = {
  amount: number;
  currency: string;
  environment: string;
};

export type PromotionOrderResponse = {
  orderId: string;
  paymentSessionId: string;
  amount: number;
  currency: string;
  serviceId?: string | null;
  serviceJobId?: string | null;
};

type ApiDataResponse<T> = {
  data: T;
};

export async function getPromotionConfig(): Promise<PromotionPaymentConfig> {
  const res = await apiRequest<ApiDataResponse<PromotionPaymentConfig>>(
    "/payments/promotion/config",
  );
  return res.data;
}

export async function createPromotionOrder(
  serviceId?: string,
): Promise<PromotionOrderResponse> {
  const res = await apiRequest<ApiDataResponse<PromotionOrderResponse>>(
    "/payments/promotion/create-order",
    {
      method: "POST",
      body: JSON.stringify(serviceId ? { serviceId } : {}),
    },
  );
  return res.data;
}

export async function verifyPromotionPayment(orderId: string) {
  const res = await apiRequest<ApiDataResponse<unknown>>(
    "/payments/promotion/verify",
    {
      method: "POST",
      body: JSON.stringify({ orderId }),
    },
  );
  return res.data;
}
