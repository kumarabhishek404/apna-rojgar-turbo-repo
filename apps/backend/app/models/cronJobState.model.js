import mongoose from "mongoose";

const CronJobStateSchema = new mongoose.Schema(
  {
    jobKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    spreadsheetId: {
      type: String,
      default: "",
    },
    lastExportAt: {
      type: Date,
      default: null,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    lastRunStatus: {
      type: String,
      enum: ["success", "failed"],
      required: false,
    },
    rowsExported: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const CronJobState = mongoose.model("CronJobState", CronJobStateSchema);

export default CronJobState;
