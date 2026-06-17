import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentSessionId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    purpose: {
      type: String,
      enum: ["SERVICE_SOCIAL_PROMOTION"],
      default: "SERVICE_SOCIAL_PROMOTION",
    },
    status: {
      type: String,
      enum: ["CREATED", "PAID", "FAILED", "EXPIRED"],
      default: "CREATED",
    },
    cashfreeOrderStatus: {
      type: String,
      default: "",
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      index: true,
    },
    serviceJobId: {
      type: String,
      default: "",
      index: true,
    },
    paidAt: {
      type: Date,
    },
    cfPaymentId: {
      type: String,
      default: "",
    },
    paymentMethod: {
      type: String,
      default: "",
      index: true,
    },
    paymentMethodDetail: {
      type: String,
      default: "",
    },
    webhookEventId: {
      type: String,
      default: "",
      index: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
