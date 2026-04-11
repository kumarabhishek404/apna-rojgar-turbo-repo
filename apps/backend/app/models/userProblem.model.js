import mongoose from "mongoose";

const UserProblemSchema = new mongoose.Schema(
  {
    user: Object,
    problemType: {
      type: String,
      required: true,
      enum: ["forgotPassword", "otherIssues"],
    },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "CANCELLED", "COMPLETED"],
      default: "PENDING",
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const UserProblem = mongoose.model("UserProblem", UserProblemSchema);

export default UserProblem;
