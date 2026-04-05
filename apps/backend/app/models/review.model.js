import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ratingType: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DELETED", "REPORTED"],
      default: "ACTIVE",
    },
    reviewerDetails: {
      name: String,
      email: String,
      profilePicture: String,
    },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
