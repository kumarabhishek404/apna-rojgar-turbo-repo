import mongoose, { Schema } from "mongoose";

/**
 * Nested notification payload.
 * IMPORTANT: `type` is a Mongoose reserved key — must use `{ type: String }`,
 * otherwise Mongoose treats the whole `data` path as a String and rejects objects.
 */
const notificationDataSchema = new Schema(
  {
    actionBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    actionOn: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
    },
    serviceIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    invitationId: {
      type: Schema.Types.ObjectId,
      ref: "Invitation",
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "Request",
    },
    url: { type: String },
    type: { type: String },
    id: { type: String },
    notificationId: { type: String },
  },
  { _id: false },
);

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "SYSTEM",
        "TRANSACTIONAL",
        "REMINDER",
        "DISCOVERY",
        "MY_SERVICES",
        "LIVE_SERVICE",
        "SPECIFIC_SERVICE",
        "ALL_USERS",
        "SPECIFIC_USER",
        "BOOKING_REQUEST",
        "PROFILE",
        "TEAM_REQUEST",
        "EMPLOYER",
      ],
      default: "SYSTEM",
    },
    priority: {
      type: String,
      enum: ["URGENT", "HIGH", "NORMAL", "LOW"],
      default: "NORMAL",
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    data: {
      type: notificationDataSchema,
      default: () => ({}),
    },
    dedupKey: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },
    scheduledFor: {
      type: Date,
      default: null,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: "",
    },
    deliveryAttempts: {
      type: Number,
      default: 0,
    },
    providerTickets: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    source: {
      type: String,
      enum: ["EVENT", "CRON", "DEFERRED", "ADMIN"],
      default: "EVENT",
    },
    read: {
      type: Boolean,
      default: false,
    },
    openedAt: {
      type: Date,
      default: null,
      index: true,
    },
    openCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({
  userId: 1,
  dedupKey: 1,
  createdAt: -1,
});
notificationSchema.index({
  status: 1,
  scheduledFor: 1,
});

export default mongoose.model("Notification", notificationSchema);
