import API_CLIENT from ".";

export interface PromotionPaymentConfig {
  amount: number;
  currency: string;
  environment: string;
}

export interface PromotionOrderResponse {
  orderId: string;
  paymentSessionId: string;
  amount: number;
  currency: string;
  environment?: string;
  devBypass?: boolean;
}

const getPromotionConfig = async (): Promise<PromotionPaymentConfig> => {
  const response = await API_CLIENT.makeGetRequest("/payments/promotion/config");
  return response?.data?.data;
};

const createPromotionOrder = async (serviceId?: string): Promise<PromotionOrderResponse> => {
  const response = await API_CLIENT.makePostRequest(
    "/payments/promotion/create-order",
    serviceId ? { serviceId } : {},
  );
  return response?.data?.data;
};

const verifyPromotionPayment = async (orderId: string) => {
  const response = await API_CLIENT.makePostRequest("/payments/promotion/verify", {
    orderId,
  });
  return response?.data?.data;
};

const PAYMENT = {
  getPromotionConfig,
  createPromotionOrder,
  verifyPromotionPayment,
};

export default PAYMENT;
