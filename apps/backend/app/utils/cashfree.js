import crypto from "crypto";
import axios from "axios";

const CASHFREE_API_VERSION = "2023-08-01";

const isProductionSecret = (secret = "") =>
  /_prod_|cfsk_ma_prod/i.test(secret);

const isSandboxSecret = (secret = "") =>
  /_test_|cfsk_ma_test|sandbox/i.test(secret);

const assertCashfreeCredentialsMatchEnv = () => {
  const env = (process.env.CASHFREE_ENV || "sandbox").toLowerCase();
  const secret = process.env.CASHFREE_CLIENT_SECRET || "";

  if (env === "sandbox" && isProductionSecret(secret)) {
    throw new Error(
      "Cashfree config mismatch: CASHFREE_ENV=sandbox but a production secret is configured. Use Test/Sandbox API keys from Cashfree Dashboard → Developers → API Keys (Test environment).",
    );
  }

  if (env === "production" && isSandboxSecret(secret)) {
    throw new Error(
      "Cashfree config mismatch: CASHFREE_ENV=production but a sandbox secret is configured. Use Production API keys instead.",
    );
  }
};

const getCashfreeConfig = () => {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  const env = (process.env.CASHFREE_ENV || "sandbox").toLowerCase();

  if (!clientId || !clientSecret) {
    throw new Error("Cashfree credentials are not configured");
  }

  assertCashfreeCredentialsMatchEnv();

  const baseURL =
    env === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

  return { clientId, clientSecret, baseURL, env };
};

const formatCashfreeError = (error) => {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) {
    if (/authentication failed/i.test(apiMessage)) {
      return "Cashfree authentication failed. Ensure API keys match CASHFREE_ENV (sandbox keys for sandbox, production keys for production).";
    }
    return apiMessage;
  }
  return error?.message || "Cashfree API request failed";
};

const cashfreeRequest = async (method, path, data) => {
  const { clientId, clientSecret, baseURL } = getCashfreeConfig();

  try {
    const response = await axios({
      method,
      url: `${baseURL}${path}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-version": CASHFREE_API_VERSION,
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
      },
      data,
    });

    return response.data;
  } catch (error) {
    const message = formatCashfreeError(error);
    const wrapped = new Error(message);
    wrapped.statusCode = error?.response?.status || 502;
    wrapped.cause = error;
    throw wrapped;
  }
};

export const createCashfreeOrder = async ({
  orderId,
  amount,
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  orderNote,
}) => {
  const payload = {
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id: String(customerId),
      customer_name: customerName || "Apna Rojgar User",
      customer_email: customerEmail || "support@apnarojgarindia.com",
      customer_phone: customerPhone,
    },
    order_note: orderNote || "Service social media promotion",
  };

  return cashfreeRequest("POST", "/orders", payload);
};

export const getCashfreeOrder = async (orderId) => {
  return cashfreeRequest("GET", `/orders/${orderId}`);
};

export const getCashfreeOrderPayments = async (orderId) => {
  const data = await cashfreeRequest("GET", `/orders/${orderId}/payments`);
  return Array.isArray(data) ? data : data?.payments || [];
};

const PAYMENT_METHOD_LABELS = {
  upi: "UPI",
  credit_card: "Card",
  debit_card: "Card",
  card: "Card",
  net_banking: "Net Banking",
  netbanking: "Net Banking",
  wallet: "Wallet",
  app: "App",
  pay_later: "Pay Later",
  bank_transfer: "Bank Transfer",
  emi: "EMI",
  cash: "Cash",
};

export const normalizePaymentMethodLabel = (raw) => {
  const key = String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
  if (!key) return "";
  if (PAYMENT_METHOD_LABELS[key]) return PAYMENT_METHOD_LABELS[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const buildPaymentMethodDetail = (methodObj, groupKey = "") => {
  if (!methodObj || typeof methodObj !== "object") return "";

  const upi = methodObj.upi;
  if (upi) {
    const channel = String(upi.channel || "").replace(/_/g, " ");
    const parts = [channel ? channel.toUpperCase() : "", upi.upi_id || upi.upi_instrument || ""].filter(
      Boolean,
    );
    return parts.join(" · ");
  }

  const card = methodObj.card;
  if (card) {
    const network = card.card_network || card.network || "";
    const last4 = card.card_number ? String(card.card_number).slice(-4) : card.last4 || "";
    return [network, last4 ? `****${last4}` : ""].filter(Boolean).join(" · ");
  }

  const netbanking = methodObj.netbanking || methodObj.net_banking;
  if (netbanking) {
    return netbanking.bank_name || netbanking.netbanking_bank_name || "Net Banking";
  }

  const wallet = methodObj.wallet;
  if (wallet) {
    return wallet.channel || wallet.provider || "Wallet";
  }

  if (groupKey) return normalizePaymentMethodLabel(groupKey);
  return "";
};

export const extractPaymentMethodFromCashfreePayment = (payment) => {
  if (!payment) {
    return { method: "", detail: "", group: "" };
  }

  const group = String(payment.payment_group || "").trim();
  const methodObj = payment.payment_method;

  if (group) {
    return {
      method: normalizePaymentMethodLabel(group) || "Other",
      detail: buildPaymentMethodDetail(methodObj, group),
      group,
    };
  }

  if (methodObj && typeof methodObj === "object") {
    const keys = Object.keys(methodObj);
    const primary = keys[0];
    if (primary) {
      return {
        method: normalizePaymentMethodLabel(primary) || "Other",
        detail: buildPaymentMethodDetail(methodObj, primary),
        group: primary,
      };
    }
  }

  return { method: "Other", detail: "", group: "" };
};

export const extractPaymentMethodFromWebhook = (payload) => {
  const payment = payload?.data?.payment || payload?.payment;
  return extractPaymentMethodFromCashfreePayment(payment);
};

export const resolveOrderPaymentMethod = async (orderId, webhookPayload = null) => {
  const fromWebhook = webhookPayload
    ? extractPaymentMethodFromWebhook(webhookPayload)
    : { method: "", detail: "", group: "" };
  if (fromWebhook.method) {
    return fromWebhook;
  }

  try {
    const payments = await getCashfreeOrderPayments(orderId);
    const successPayment =
      payments.find((entry) => String(entry?.payment_status || "").toUpperCase() === "SUCCESS") ||
      payments[0];
    return extractPaymentMethodFromCashfreePayment(successPayment);
  } catch {
    return { method: "", detail: "", group: "" };
  }
};

export const isCashfreeOrderPaid = (order) => {
  const status = String(order?.order_status || "").toUpperCase();
  return status === "PAID";
};

export const generatePromotionOrderId = (userId) => {
  const suffix = Date.now().toString(36);
  const userPart = String(userId).slice(-6);
  return `promo_${userPart}_${suffix}`;
};

export const getPromotionAmount = () => {
  const amount = Number(process.env.SERVICE_PROMOTION_AMOUNT || 100);
  return Number.isFinite(amount) && amount > 0 ? amount : 100;
};

export const verifyCashfreeWebhookSignature = ({
  timestamp,
  rawBody,
  signature,
}) => {
  const secret = process.env.CASHFREE_CLIENT_SECRET;
  if (!secret) {
    throw new Error("Cashfree credentials are not configured");
  }

  if (!timestamp || !rawBody || !signature) {
    throw new Error("Missing webhook signature headers or body");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}${rawBody}`)
    .digest("base64");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw new Error("Invalid webhook signature");
  }

  return true;
};
