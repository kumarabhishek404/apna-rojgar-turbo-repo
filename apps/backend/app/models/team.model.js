// app/models/team.model.js
import mongoose, { Schema } from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    mediator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
    },
    workingHours: {
      start: {
        type: String,
      },
      end: {
        type: String,
      },
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
    specialization: {
      type: String,
      trim: true,
    },
    contactInfo: {
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Team = mongoose.model("Team", teamSchema);

export default Team;
