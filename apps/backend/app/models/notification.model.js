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
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);
