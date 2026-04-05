import mongoose from "mongoose";

const invitationSchema = mongoose.Schema(
  {
    employer: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    bookedWorker: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    images: [String],
    status: {
      type: String,
      enum: ["ACCEPTED", "REJECTED", "CANCELLED", "PENDING", "REMOVED", "LEFT"],
      default: "PENDING",
    },
    appliedSkill: {
      type: Object,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    facilities: {
      food: { type: Boolean, default: false },
      living: { type: Boolean, default: false },
      travelling: { type: Boolean, default: false },
      esi_pf: { type: Boolean, default: false },
    },
    description: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: true,
    },
    requiredNumberOfWorkers: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Invitation", invitationSchema);
