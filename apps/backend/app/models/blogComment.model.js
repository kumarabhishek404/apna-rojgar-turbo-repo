import mongoose from "mongoose";

const blogCommentSchema = new mongoose.Schema(
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
    /** Null = top-level comment; set to parent comment id for a reply. */
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogComment",
      default: null,
      index: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DELETED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true },
);

blogCommentSchema.index({ blogId: 1, parentId: 1, createdAt: -1 });

const BlogComment = mongoose.model("BlogComment", blogCommentSchema);
export default BlogComment;
