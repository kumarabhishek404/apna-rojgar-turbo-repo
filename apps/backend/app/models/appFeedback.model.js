import mongoose from "mongoose";

const appFeedbackSchema = new mongoose.Schema(
  {
    // Sender details
    sender: {
      type: Object,
      default: {},
    },
    // Feedback details
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedbackType: {
      type: String,
      required: true,
      enum: ["BUG", "FEATURE_REQUEST", "IMPROVEMENT", "GENERAL"],
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional fields
    deviceInfo: {
      type: Object,
      default: {},
    },
    appVersion: {
      type: String,
      default: "unknown",
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const AppFeedback = mongoose.model("AppFeedback", appFeedbackSchema);

export default AppFeedback;
