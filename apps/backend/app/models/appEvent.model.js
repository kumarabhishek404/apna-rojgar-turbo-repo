import mongoose from "mongoose";

const AppEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    sessionId: { type: String, required: true, index: true },
    platform: {
      type: String,
      enum: ["ios", "android", "web"],
    },
    appVersion: String,
    osVersion: String,
    deviceModel: String,
    deviceManufacturer: String,
    isPhysicalDevice: Boolean,
    locale: String,
    timezone: String,
    nativeBuildVersion: String,
    expoRuntimeVersion: String,
    appName: String,

    eventName: { type: String, required: true, index: true },
    properties: { type: mongoose.Schema.Types.Mixed, default: {} },

    clientTimestamp: { type: Date, required: true },
    batchSentAt: { type: Date },
    serverTimestamp: { type: Date, default: Date.now, index: true },

    ip: String,
    userAgent: String,
  },
  { collection: "app_events", timestamps: false },
);

AppEventSchema.index({ serverTimestamp: -1 });
AppEventSchema.index({ eventName: 1, serverTimestamp: -1 });
AppEventSchema.index({ userId: 1, serverTimestamp: -1 });
AppEventSchema.index({ sessionId: 1, serverTimestamp: -1 });
AppEventSchema.index({ "properties.serviceId": 1, eventName: 1 });

const AppEvent = mongoose.model("AppEvent", AppEventSchema);

export default AppEvent;
