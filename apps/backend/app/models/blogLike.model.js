import mongoose from "mongoose";

const blogLikeSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

blogLikeSchema.index({ blogId: 1, userId: 1 }, { unique: true });

const BlogLike = mongoose.model("BlogLike", blogLikeSchema);
export default BlogLike;
