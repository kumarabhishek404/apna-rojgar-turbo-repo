import mongoose from "mongoose";

const AppMetadataSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    valueType: {
      type: String,
      enum: ["string", "number", "boolean", "json"],
      default: "string",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.model("AppMetadata", AppMetadataSchema);
