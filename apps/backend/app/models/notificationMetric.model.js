import mongoose, { Schema } from "mongoose";

const notificationMetricSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      enum: ["SKIPPED", "OPT_OUT"],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    notificationType: {
      type: String,
      default: "",
      index: true,
    },
    category: {
      type: String,
      default: "",
      index: true,
    },
    dedupKey: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      default: "EVENT",
    },
  },
  { timestamps: true },
);

notificationMetricSchema.index({ event: 1, reason: 1, createdAt: -1 });
notificationMetricSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

export default mongoose.model("NotificationMetric", notificationMetricSchema);
