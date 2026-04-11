import mongoose, { Schema } from "mongoose";

const requirementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    required: true,
  },
  payPerDay: {
    type: Number,
    required: true,
  },
  food: {
    type: Boolean,
    required: true,
    default: false,
  },
  living: {
    type: Boolean,
    required: true,
    default: false,
  },
  pf: {
    type: Boolean,
    required: true,
    default: false,
  },
  insurance: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const serviceSchema = new mongoose.Schema(
  {
    jobID: {
      type: String,
      required: true,
    },
    bookingType: {
      type: String,
      enum: ["direct", "byService"],
      required: true,
    },
    status: {
      type: String,
      enum: ["HIRING", "CANCELLED", "COMPLETED", "PENDING", "REJECTED"],
      default: "HIRING",
    },
    employer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookedWorker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.bookingType === "direct";
      },
    },
    type: {
      type: String,
    },
    subType: {
      type: String,
    },
    appliedSkill: {
      type: Object,
    },
    description: {
      type: String,
    },
    images: {
      type: [String],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    duration: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    uploadStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    uploadProgress: {
      type: Number,
      default: 0, // 0 to 100
    },
    facilities: {
      food: { type: Boolean, default: false },
      living: { type: Boolean, default: false },
      travelling: { type: Boolean, default: false },
      esi_pf: { type: Boolean, default: false },
    },
    requirements: [requirementSchema],
    appliedUsers: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" }, // Mediator
        skill: { type: String, required: true }, // ✅ Added skill for mediator
        workers: [
          {
            worker: { type: Schema.Types.ObjectId, ref: "User" },
            skill: { type: String, required: true }, // ✅ Added skill for workers
            status: {
              type: String,
              enum: [
                "PENDING",
                "ACCEPTED",
                "REJECTED",
                "CANCELLED",
                "REMOVED",
                "SERVICE_CANCELLED",
                "SERVICE_COMPLETED",
              ],
              default: "PENDING",
            },
          },
        ],
        removedWorkers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        /** When set, lists every service requirement name this application covers (web apply). */
        appliedSkills: [{ type: String }],
        applicantType: {
          type: String,
          enum: ["INDIVIDUAL", "CONTRACTOR"],
          default: "INDIVIDUAL",
        },
        contractorManpower: { type: Number },
        status: {
          type: String,
          enum: [
            "PENDING",
            "ACCEPTED",
            "REJECTED",
            "CANCELLED",
            "SERVICE_CANCELLED",
            "SERVICE_COMPLETED",
          ],
          default: "PENDING",
        },
      },
    ],
    selectedUsers: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" }, // Mediator
        skill: { type: String, required: true }, // ✅ Added skill for mediator
        workers: [
          {
            worker: { type: Schema.Types.ObjectId, ref: "User" },
            skill: { type: String, required: true }, // ✅ Added skill for workers
            status: {
              type: String,
              enum: [
                "SELECTED",
                "CANCELLED",
                "REMOVED",
                "SERVICE_CANCELLED",
                "SERVICE_COMPLETED",
              ],
              default: "SELECTED",
            },
          },
        ],
        status: {
          type: String,
          enum: [
            "SELECTED",
            "CANCELLED",
            "REMOVED",
            "SERVICE_CANCELLED",
            "SERVICE_COMPLETED",
          ],
          default: "SELECTED",
        },
      },
    ],
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    attendance: [
      {
        worker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        records: [
          {
            date: { type: Date, required: true },
            status: {
              type: String,
              enum: ["PRESENT", "ABSENT", "HALF-DAY"],
              default: "PRESENT",
            },
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

const Service = mongoose.model("Service", serviceSchema);

export default Service;
