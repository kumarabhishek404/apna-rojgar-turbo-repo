import mongoose from "mongoose";

const deviceSnapshotSchema = new mongoose.Schema(
  {
    ip: { type: String },
    userAgent: { type: String },
    platform: { type: String },
    osVersion: { type: String },
    appVersion: { type: String },
    deviceModel: { type: String },
    deviceManufacturer: { type: String },
    locale: { type: String },
    timezone: { type: String },
    expoRuntimeVersion: { type: String },
    nativeBuildVersion: { type: String },
    appName: { type: String },
    sessionId: { type: String },
    isPhysicalDevice: { type: Boolean },
    forwardedFor: { type: String },
  },
  { _id: false },
);

const userSnapshotSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String },
    mobile: { type: String },
    countryCode: { type: String },
    role: { type: String },
    email: { type: String },
    locale: { type: String },
  },
  { _id: false },
);

const errorLogSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    stack: { type: String },
    apiRoute: { type: String },
    method: { type: String, enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
    requestBody: { type: Object, default: {} },
    requestParams: { type: Object, default: {} },
    requestQuery: { type: Object, default: {} },
    statusCode: { type: Number, default: 500 },
    /** Populated when JWT payload can be read but user was not attached (e.g. invalid signature). */
    tokenSubjectUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    user: { type: userSnapshotSchema, default: () => ({}) },
    device: { type: deviceSnapshotSchema, default: () => ({}) },
    /** Non-sensitive request headers (user-agent, accept-*, x-* except auth). */
    clientHeaders: { type: Object, default: {} },
  },
  { timestamps: true },
);

export default mongoose.model("ErrorLog", errorLogSchema);
