import User from "../models/user.model.js";
import Payment from "../models/payment.model.js";
import Service from "../models/service.model.js";
import logError from "../utils/addErrorLog.js";
import {
  createCashfreeOrder,
  generatePromotionOrderId,
  getCashfreeOrder,
  getPromotionAmount,
  isCashfreeOrderPaid,
  resolveOrderPaymentMethod,
  verifyCashfreeWebhookSignature,
} from "../utils/cashfree.js";
import {
  applyPromotionToService,
  isServicePromoted,
  markPromotionPaymentPaid,
  syncPromotionPaymentByOrderId,
} from "../utils/payment.service.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getCustomerPhone = (user) => {
  const mobile = String(user?.mobile || "").replace(/\D/g, "");
  if (mobile.length >= 10) {
    return mobile.slice(-10);
  }
  return "9999999999";
};

const getCustomerEmail = (user) => {
  const email = user?.email?.value;
  if (email && email.includes("@")) return email;
  return "support@apnarojgarindia.com";
};

const validateServiceForPromotion = async (serviceId, employerId) => {
  if (!serviceId) return null;

  const service = await Service.findOne({
    _id: serviceId,
    employer: employerId,
    bookingType: "byService",
    status: "HIRING",
  });

  if (!service) {
    throw new Error("Service not found or cannot be promoted");
  }

  if (isServicePromoted(service)) {
    throw new Error("This work is already promoted");
  }

  await Payment.updateMany(
    {
      service: service._id,
      purpose: "SERVICE_SOCIAL_PROMOTION",
      status: "CREATED",
    },
    { status: "EXPIRED" },
  );

  const activePayment = await Payment.findOne({
    service: service._id,
    purpose: "SERVICE_SOCIAL_PROMOTION",
    status: "PAID",
  });

  if (activePayment) {
    throw new Error("This work is already promoted");
  }

  return service;
};

const finalizePaidPromotion = async (payment, extras = {}) => {
  let methodExtras = {};
  if (!extras.paymentMethod) {
    const resolved = await resolveOrderPaymentMethod(
      payment.orderId,
      extras.webhookPayload || null,
    );
    if (resolved.method) {
      methodExtras = {
        paymentMethod: resolved.method,
        paymentMethodDetail: resolved.detail,
        paymentMethodGroup: resolved.group,
      };
    }
  }

  await markPromotionPaymentPaid(payment, { ...extras, ...methodExtras });
  await applyPromotionToService(payment);
};

export const createServicePromotionOrder = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.user;
    const { serviceId } = req.body || {};
    const employer = await User.findById(_id);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const linkedService = await validateServiceForPromotion(serviceId, _id);
    const amount = getPromotionAmount();
    const orderId = generatePromotionOrderId(_id);

    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      amount,
      customerId: _id,
      customerName: employer.name || "Employer",
      customerEmail: getCustomerEmail(employer),
      customerPhone: getCustomerPhone(employer),
      orderNote: linkedService
        ? `Promotion for service ${linkedService.jobID}`
        : "Apna Rojgar service social media promotion",
    });

    const payment = await Payment.create({
      user: _id,
      orderId: cashfreeOrder.order_id,
      paymentSessionId: cashfreeOrder.payment_session_id,
      amount,
      currency: "INR",
      purpose: "SERVICE_SOCIAL_PROMOTION",
      status: "CREATED",
      cashfreeOrderStatus: cashfreeOrder.order_status || "ACTIVE",
      ...(linkedService
        ? {
            service: linkedService._id,
            serviceJobId: linkedService.jobID || "",
            metadata: {
              serviceId: String(linkedService._id),
              serviceJobId: linkedService.jobID || "",
            },
          }
        : {}),
    });

    return res.status(201).json({
      success: true,
      data: {
        orderId: payment.orderId,
        paymentSessionId: payment.paymentSessionId,
        amount: payment.amount,
        currency: payment.currency,
        serviceId: payment.service || null,
        serviceJobId: payment.serviceJobId || null,
      },
      message: "Promotion payment order created",
    });
  } catch (error) {
    await logError(error, req);
    const message =
      error?.message ||
      error?.response?.data?.message ||
      "Failed to create payment order";
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json({ success: false, message });
  }
});

export const verifyServicePromotionPayment = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.user;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const payment = await Payment.findOne({
      orderId,
      user: _id,
      purpose: "SERVICE_SOCIAL_PROMOTION",
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    if (payment.status === "PAID") {
      await applyPromotionToService(payment);
      return res.status(200).json({
        success: true,
        data: {
          orderId: payment.orderId,
          status: payment.status,
          amount: payment.amount,
          serviceId: payment.service,
        },
        message: "Payment already verified",
      });
    }

    const cashfreeOrder = await getCashfreeOrder(orderId);
    const paid = isCashfreeOrderPaid(cashfreeOrder);

    if (!paid) {
      payment.cashfreeOrderStatus =
        cashfreeOrder.order_status || payment.cashfreeOrderStatus;
      payment.status = "FAILED";
      await payment.save();

      return res.status(402).json({
        success: false,
        message: "Payment not completed. Please try again.",
        data: {
          orderId: payment.orderId,
          status: payment.status,
        },
      });
    }

    await finalizePaidPromotion(payment, {
      cashfreeOrderStatus: cashfreeOrder.order_status,
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId: payment.orderId,
        status: payment.status,
        amount: payment.amount,
        serviceId: payment.service,
      },
      message: "Payment verified successfully",
    });
  } catch (error) {
    await logError(error, req);
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to verify payment";
    return res.status(500).json({ success: false, message });
  }
});

export const getPromotionPaymentConfig = asyncHandler(async (_req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      amount: getPromotionAmount(),
      currency: "INR",
      environment: (process.env.CASHFREE_ENV || "sandbox").toLowerCase(),
    },
  });
});

const extractWebhookOrderId = (payload) => {
  return (
    payload?.data?.order?.order_id ||
    payload?.data?.order?.orderId ||
    payload?.order?.order_id ||
    payload?.order_id ||
    null
  );
};

const extractWebhookPaymentId = (payload) => {
  return (
    payload?.data?.payment?.cf_payment_id ||
    payload?.data?.payment?.payment_id ||
    payload?.payment?.cf_payment_id ||
    null
  );
};

export const handleCashfreeWebhook = asyncHandler(async (req, res) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body || {});
    const timestamp = req.headers["x-webhook-timestamp"];
    const signature = req.headers["x-webhook-signature"];
    const eventId =
      req.headers["x-webhook-id"] ||
      req.headers["x-idempotency-key"] ||
      "";

    const skipVerify =
      process.env.CASHFREE_WEBHOOK_SKIP_VERIFY === "true" &&
      process.env.NODE_ENV === "development";

    if (!skipVerify) {
      verifyCashfreeWebhookSignature({ timestamp, rawBody, signature });
    }

    const payload =
      typeof req.body === "object" && req.body !== null
        ? req.body
        : JSON.parse(rawBody);

    const eventType = String(payload?.type || "").toUpperCase();
    const orderId = extractWebhookOrderId(payload);

    if (!orderId) {
      return res.status(200).json({ success: true, message: "Ignored webhook" });
    }

    const payment = await Payment.findOne({
      orderId,
      purpose: "SERVICE_SOCIAL_PROMOTION",
    });

    if (!payment) {
      return res.status(200).json({ success: true, message: "Payment not tracked" });
    }

    if (eventId && payment.webhookEventId === eventId) {
      return res.status(200).json({ success: true, message: "Duplicate webhook" });
    }

    const cfPaymentId = extractWebhookPaymentId(payload);

    if (
      eventType.includes("SUCCESS") ||
      eventType.includes("PAID") ||
      payload?.data?.payment?.payment_status === "SUCCESS"
    ) {
      await finalizePaidPromotion(payment, {
        cashfreeOrderStatus: payload?.data?.order?.order_status || "PAID",
        cfPaymentId,
        webhookPayload: payload,
        metadata: {
          lastWebhookType: eventType,
          lastWebhookAt: new Date().toISOString(),
        },
      });
    } else if (
      eventType.includes("FAILED") ||
      payload?.data?.payment?.payment_status === "FAILED"
    ) {
      payment.status = "FAILED";
      payment.cashfreeOrderStatus =
        payload?.data?.order?.order_status || payment.cashfreeOrderStatus;
      payment.metadata = {
        ...(payment.metadata || {}),
        lastWebhookType: eventType,
        lastWebhookAt: new Date().toISOString(),
      };
      await payment.save();
    } else {
      await syncPromotionPaymentByOrderId(orderId, {
        cfPaymentId,
        metadata: {
          lastWebhookType: eventType || "UNKNOWN",
          lastWebhookAt: new Date().toISOString(),
        },
      });
    }

    if (eventId) {
      payment.webhookEventId = eventId;
      await payment.save();
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    await logError(error, req);
    return res.status(400).json({
      success: false,
      message: error?.message || "Webhook processing failed",
    });
  }
});
