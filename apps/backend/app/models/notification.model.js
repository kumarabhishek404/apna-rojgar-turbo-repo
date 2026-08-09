import mongoose, { Schema } from "mongoose";

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
      actionBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      actionOn: {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to the user who is the subject of the action
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
      url: String,
      type: String,
      id: String,
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
  }
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
