import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true,
    },
    pushToken: { type: String, unique: true, index: true },
    deviceType: {
      type: String,
      enum: ["UNKNOWN", "PHONE", "TABLET", "DESKTOP", "TV"], // {"0": "UNKNOWN", "1": "PHONE", "2": "TABLET", "3": "DESKTOP", "4": "TV", "DESKTOP": 3, "PHONE": 1, "TABLET": 2, "TV": 4, "UNKNOWN": 0}
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Device", deviceSchema);
