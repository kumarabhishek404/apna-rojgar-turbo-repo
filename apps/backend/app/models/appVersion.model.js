import mongoose from "mongoose";

const AppVersionSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["android", "ios"],
      required: true,
      unique: true,
    },
    latestVersion: {
      type: String,
      required: true,
    },
    minSupportedVersion: {
      type: String,
      required: true,
    },
    storeUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("AppVersion", AppVersionSchema);
