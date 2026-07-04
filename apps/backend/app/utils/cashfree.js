import crypto from "crypto";
import axios from "axios";

const CASHFREE_API_VERSION = "2023-08-01";
const MOCK_SESSION_PREFIX = "session_dev_bypass_";

const readEnv = (key) => process.env[key]?.trim() || "";

export const isCashfreeConfigured = () =>
  Boolean(readEnv("CASHFREE_CLIENT_ID") && readEnv("CASHFREE_CLIENT_SECRET"));

export const isMockCashfreePaymentSession = (paymentSessionId = "") =>
  String(paymentSessionId).startsWith(MOCK_SESSION_PREFIX);

/**
 * Dev promotion payment bypass when Cashfree keys are not set.
 * Hosted dev (Render) can set CASHFREE_DEV_BYPASS=true or DEV_BYPASS_OTP=true.
 * Production / live Cashfree always requires real credentials.
 */
export const isCashfreeDevBypassEnabled = () => {
  if (isCashfreeConfigured()) return false;

  const env = readEnv("CASHFREE_ENV").toLowerCase();
  if (env === "production") return false;

  const forceLive = readEnv("CASHFREE_FORCE_LIVE").toLowerCase();
  if (forceLive === "1" || forceLive === "true" || forceLive === "yes") {
    return false;
  }

  const explicitBypass = readEnv("CASHFREE_DEV_BYPASS").toLowerCase();
  if (explicitBypass === "1" || explicitBypass === "true" || explicitBypass === "yes") {
    return true;
  }
  if (explicitBypass === "0" || explicitBypass === "false" || explicitBypass === "no") {
    return false;
  }

  const otpBypass = readEnv("DEV_BYPASS_OTP") || readEnv("SKIP_OTP");
  if (["1", "true", "yes"].includes(otpBypass.toLowerCase())) {
    return true;
  }

  return readEnv("NODE_ENV") === "development";
};

const createMockCashfreeOrder = ({ orderId, amount }) => ({
  order_id: orderId,
  payment_session_id: `${MOCK_SESSION_PREFIX}${orderId}`,
  order_status: "ACTIVE",
  order_amount: amount,
  order_currency: "INR",
});

const isProductionSecret = (secret = "") =>
  /_prod_|cfsk_ma_prod/i.test(secret);

const isSandboxSecret = (secret = "") =>
  /_test_|cfsk_ma_test|sandbox/i.test(secret);

const assertCashfreeCredentialsMatchEnv = () => {
  const env = (readEnv("CASHFREE_ENV") || "sandbox").toLowerCase();
  const secret = readEnv("CASHFREE_CLIENT_SECRET");

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
  const clientId = readEnv("CASHFREE_CLIENT_ID");
  const clientSecret = readEnv("CASHFREE_CLIENT_SECRET");
  const env = (readEnv("CASHFREE_ENV") || "sandbox").toLowerCase();

  if (!clientId || !clientSecret) {
    if (isCashfreeDevBypassEnabled()) {
      return { devBypass: true };
    }
    throw new Error(
      "Cashfree credentials are not configured. Set CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET on the backend, or enable CASHFREE_DEV_BYPASS=true for development.",
    );
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
  const config = getCashfreeConfig();
  if (config.devBypass) {
    throw new Error("Cashfree API called while dev bypass is active");
  }

  const { clientId, clientSecret, baseURL } = config;

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
  const config = getCashfreeConfig();
  if (config.devBypass) {
    return createMockCashfreeOrder({ orderId, amount });
  }

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
  if (!isCashfreeConfigured() && isCashfreeDevBypassEnabled()) {
    return {
      order_id: orderId,
      order_status: "PAID",
    };
  }

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
  const secret = readEnv("CASHFREE_CLIENT_SECRET");
  if (!secret) {
    if (isCashfreeDevBypassEnabled()) {
      return true;
    }
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
