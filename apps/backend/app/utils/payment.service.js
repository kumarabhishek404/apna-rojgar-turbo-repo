import Payment from "../models/payment.model.js";
import Service from "../models/service.model.js";
import { getCashfreeOrder, isCashfreeOrderPaid, resolveOrderPaymentMethod } from "../utils/cashfree.js";

export const markPromotionPaymentPaid = async (payment, extras = {}) => {
  if (!payment || payment.status === "PAID") {
    return payment;
  }

  payment.status = "PAID";
  payment.paidAt = payment.paidAt || new Date();
  payment.cashfreeOrderStatus = extras.cashfreeOrderStatus || payment.cashfreeOrderStatus;
  payment.metadata = {
    ...(payment.metadata || {}),
    ...extras.metadata,
  };

  if (extras.cfPaymentId) {
    payment.cfPaymentId = String(extras.cfPaymentId);
    payment.metadata.cfPaymentId = payment.cfPaymentId;
  }

  if (extras.paymentMethod) {
    payment.paymentMethod = String(extras.paymentMethod);
    payment.metadata.paymentMethod = payment.paymentMethod;
  }

  if (extras.paymentMethodDetail) {
    payment.paymentMethodDetail = String(extras.paymentMethodDetail);
    payment.metadata.paymentMethodDetail = payment.paymentMethodDetail;
  }

  if (extras.paymentMethodGroup) {
    payment.metadata.paymentMethodGroup = String(extras.paymentMethodGroup);
  }

  await payment.save();
  return payment;
};

export const linkPaymentToService = async ({
  orderId,
  userId,
  serviceId,
  serviceJobId = "",
}) => {
  if (!orderId || !serviceId) {
    return null;
  }

  return Payment.findOneAndUpdate(
    {
      orderId,
      ...(userId ? { user: userId } : {}),
      purpose: "SERVICE_SOCIAL_PROMOTION",
    },
    {
      $set: {
        service: serviceId,
        serviceJobId: serviceJobId || "",
        "metadata.serviceId": String(serviceId),
        ...(serviceJobId ? { "metadata.serviceJobId": serviceJobId } : {}),
        "metadata.linkedAt": new Date().toISOString(),
      },
    },
    { new: true },
  );
};

export const syncPromotionPaymentByOrderId = async (orderId, extras = {}) => {
  const payment = await Payment.findOne({
    orderId,
    purpose: "SERVICE_SOCIAL_PROMOTION",
  });

  if (!payment) {
    return null;
  }

  if (payment.status === "PAID") {
    return payment;
  }

  if (extras.forcePaid) {
    return markPromotionPaymentPaid(payment, extras);
  }

  const cashfreeOrder = await getCashfreeOrder(orderId);
  if (!isCashfreeOrderPaid(cashfreeOrder)) {
    return payment;
  }

  let methodExtras = {};
  if (!extras.paymentMethod && !payment.paymentMethod) {
    const resolved = await resolveOrderPaymentMethod(orderId);
    if (resolved.method) {
      methodExtras = {
        paymentMethod: resolved.method,
        paymentMethodDetail: resolved.detail,
        paymentMethodGroup: resolved.group,
      };
    }
  }

  return markPromotionPaymentPaid(payment, {
    cashfreeOrderStatus: cashfreeOrder.order_status,
    ...methodExtras,
    ...extras,
  });
};

export const getPromotionPaymentStats = async (query = {}) => {
  const baseQuery = { purpose: "SERVICE_SOCIAL_PROMOTION", ...query };

  const [statusCounts, paidAgg, promotedServices] = await Promise.all([
    Payment.aggregate([
      { $match: baseQuery },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { ...baseQuery, status: "PAID" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Service.countDocuments({ "socialMediaPromotion.enabled": true }),
  ]);

  const stats = {
    total: 0,
    paid: 0,
    created: 0,
    failed: 0,
    expired: 0,
    totalPaidAmount: paidAgg[0]?.totalAmount || 0,
    promotedServices,
  };

  statusCounts.forEach((entry) => {
    const key = String(entry._id || "").toLowerCase();
    stats.total += entry.count;
    if (key === "paid") stats.paid = entry.count;
    else if (key === "created") stats.created = entry.count;
    else if (key === "failed") stats.failed = entry.count;
    else if (key === "expired") stats.expired = entry.count;
  });

  return stats;
};

export const isServicePromoted = (service) =>
  Boolean(
    service?.socialMediaPromotion?.enabled &&
      service?.socialMediaPromotion?.status === "PAID",
  );

export const applyPromotionToService = async (payment) => {
  if (!payment?.service || payment.status !== "PAID") {
    return null;
  }

  const service = await Service.findById(payment.service);
  if (!service) {
    throw new Error("Service not found");
  }

  if (isServicePromoted(service)) {
    return service;
  }

  service.socialMediaPromotion = {
    enabled: true,
    orderId: payment.orderId,
    amount: payment.amount,
    status: "PAID",
    paidAt: payment.paidAt || new Date(),
  };
  await service.save();

  if (!payment.serviceJobId && service.jobID) {
    payment.serviceJobId = service.jobID;
    payment.metadata = {
      ...(payment.metadata || {}),
      serviceJobId: service.jobID,
    };
    await payment.save();
  }

  return service;
};
