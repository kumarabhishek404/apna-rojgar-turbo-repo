import mongoose from "mongoose";
import Blog from "../models/blog.model.js";
import BlogLike from "../models/blogLike.model.js";
import BlogComment from "../models/blogComment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logError from "../utils/addErrorLog.js";

async function findPublishedBlog(slugOrId) {
  const key = String(slugOrId || "").trim();
  if (!key) return null;
  const or = [{ slug: key.toLowerCase() }];
  if (/^[a-f\d]{24}$/i.test(key)) or.push({ _id: key });
  return Blog.findOne({ status: "PUBLISHED", $or: or });
}

function mapAuthor(user) {
  if (!user) return { name: "User", photo: "" };
  return {
    _id: user._id?.toString?.() || String(user._id || ""),
    name: user.name || "User",
    photo:
      user.profilePicture ||
      user.profilePic ||
      user.profileImage ||
      user.avatar ||
      "",
  };
}

export const getBlogEngagement = async (req, res) => {
  try {
    const blog = await findPublishedBlog(req.params.slugOrId);
    if (!blog) {
      return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
    }

    const userId = req.user?._id || null;
    let likedByMe = false;
    if (userId) {
      likedByMe = Boolean(
        await BlogLike.exists({ blogId: blog._id, userId }),
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          blogId: blog._id.toString(),
          likeCount: blog.likeCount || 0,
          commentCount: blog.commentCount || 0,
          shareCount: blog.shareCount || 0,
          likedByMe,
        },
        "Engagement fetched",
      ),
    );
  } catch (error) {
    logError(error, req, 500, "blogEngagement.controller - getBlogEngagement");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to fetch engagement"));
  }
};

export const recordBlogShare = async (req, res) => {
  try {
    const blog = await findPublishedBlog(req.params.slugOrId);
    if (!blog) {
      return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
    }

    await Blog.updateOne({ _id: blog._id }, { $inc: { shareCount: 1 } });
    const fresh = await Blog.findById(blog._id).select("shareCount").lean();

    return res.status(200).json(
      new ApiResponse(
        200,
        { shareCount: fresh?.shareCount || 0 },
        "Share recorded",
      ),
    );
  } catch (error) {
    logError(error, req, 500, "blogEngagement.controller - recordBlogShare");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to record share"));
  }
};

export const toggleBlogLike = async (req, res) => {
  try {
    const blog = await findPublishedBlog(req.params.slugOrId);
    if (!blog) {
      return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
    }

    const userId = req.user._id;
    const existing = await BlogLike.findOne({ blogId: blog._id, userId });

    let likedByMe;
    if (existing) {
      await existing.deleteOne();
      await Blog.updateOne(
        { _id: blog._id, likeCount: { $gt: 0 } },
        { $inc: { likeCount: -1 } },
      );
      likedByMe = false;
    } else {
      await BlogLike.create({ blogId: blog._id, userId });
      await Blog.updateOne({ _id: blog._id }, { $inc: { likeCount: 1 } });
      likedByMe = true;
    }

    const fresh = await Blog.findById(blog._id).select("likeCount").lean();
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          likedByMe,
          likeCount: fresh?.likeCount || 0,
        },
        likedByMe ? "Liked" : "Unliked",
      ),
    );
  } catch (error) {
    if (error?.code === 11000) {
      // Race: treat as liked
      const blog = await findPublishedBlog(req.params.slugOrId);
      const fresh = await Blog.findById(blog?._id).select("likeCount").lean();
      return res.status(200).json(
        new ApiResponse(
          200,
          { likedByMe: true, likeCount: fresh?.likeCount || 0 },
          "Liked",
        ),
      );
    }
    logError(error, req, 500, "blogEngagement.controller - toggleBlogLike");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to toggle like"));
  }
};

export const listBlogComments = async (req, res) => {
  try {
    const blog = await findPublishedBlog(req.params.slugOrId);
    if (!blog) {
      return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const [topLevel, total] = await Promise.all([
      BlogComment.find({
        blogId: blog._id,
        parentId: null,
        status: "ACTIVE",
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "name profilePicture")
        .lean(),
      BlogComment.countDocuments({
        blogId: blog._id,
        parentId: null,
        status: "ACTIVE",
      }),
    ]);

    const parentIds = topLevel.map((c) => c._id);
    const replies = parentIds.length
      ? await BlogComment.find({
          blogId: blog._id,
          parentId: { $in: parentIds },
          status: "ACTIVE",
        })
          .sort({ createdAt: 1 })
          .populate("userId", "name profilePicture")
          .lean()
      : [];

    const repliesByParent = new Map();
    for (const reply of replies) {
      const key = String(reply.parentId);
      if (!repliesByParent.has(key)) repliesByParent.set(key, []);
      repliesByParent.get(key).push({
        _id: reply._id.toString(),
        body: reply.body,
        createdAt: reply.createdAt,
        author: mapAuthor(reply.userId),
      });
    }

    const comments = topLevel.map((c) => ({
      _id: c._id.toString(),
      body: c.body,
      createdAt: c.createdAt,
      author: mapAuthor(c.userId),
      replies: repliesByParent.get(c._id.toString()) || [],
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          comments,
          pagination: {
            page,
            limit,
            total,
            pages: Math.max(1, Math.ceil(total / limit)),
          },
        },
        "Comments fetched",
      ),
    );
  } catch (error) {
    logError(error, req, 500, "blogEngagement.controller - listBlogComments");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to fetch comments"));
  }
};

export const createBlogComment = async (req, res) => {
  try {
    const blog = await findPublishedBlog(req.params.slugOrId);
    if (!blog) {
      return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
    }

    const body = String(req.body?.body || "").trim();
    if (body.length < 2) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Comment must be at least 2 characters"));
    }
    if (body.length > 2000) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Comment is too long"));
    }

    const comment = await BlogComment.create({
      blogId: blog._id,
      userId: req.user._id,
      parentId: null,
      body,
    });
    await Blog.updateOne({ _id: blog._id }, { $inc: { commentCount: 1 } });

    const populated = await BlogComment.findById(comment._id)
      .populate("userId", "name profilePicture")
      .lean();

    const fresh = await Blog.findById(blog._id).select("commentCount").lean();

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          comment: {
            _id: populated._id.toString(),
            body: populated.body,
            createdAt: populated.createdAt,
            author: mapAuthor(populated.userId),
            replies: [],
          },
          commentCount: fresh?.commentCount || 0,
        },
        "Comment added",
      ),
    );
  } catch (error) {
    logError(error, req, 500, "blogEngagement.controller - createBlogComment");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to add comment"));
  }
};

export const replyBlogComment = async (req, res) => {
  try {
    const blog = await findPublishedBlog(req.params.slugOrId);
    if (!blog) {
      return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
    }

    const commentId = String(req.params.commentId || "").trim();
    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid comment id"));
    }

    const parent = await BlogComment.findOne({
      _id: commentId,
      blogId: blog._id,
      status: "ACTIVE",
    });
    if (!parent) {
      return res.status(404).json(new ApiResponse(404, null, "Comment not found"));
    }

    // Only allow replies on top-level comments (one nesting level).
    const rootParentId = parent.parentId || parent._id;

    const body = String(req.body?.body || "").trim();
    if (body.length < 2) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Reply must be at least 2 characters"));
    }
    if (body.length > 2000) {
      return res.status(400).json(new ApiResponse(400, null, "Reply is too long"));
    }

    const reply = await BlogComment.create({
      blogId: blog._id,
      userId: req.user._id,
      parentId: rootParentId,
      body,
    });
    await Blog.updateOne({ _id: blog._id }, { $inc: { commentCount: 1 } });

    const populated = await BlogComment.findById(reply._id)
      .populate("userId", "name profilePicture")
      .lean();
    const fresh = await Blog.findById(blog._id).select("commentCount").lean();

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          reply: {
            _id: populated._id.toString(),
            body: populated.body,
            createdAt: populated.createdAt,
            author: mapAuthor(populated.userId),
            parentId: rootParentId.toString(),
          },
          commentCount: fresh?.commentCount || 0,
        },
        "Reply added",
      ),
    );
  } catch (error) {
    logError(error, req, 500, "blogEngagement.controller - replyBlogComment");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to add reply"));
  }
};

export const deleteBlogComment = async (req, res) => {
  try {
    const blog = await findPublishedBlog(req.params.slugOrId);
    if (!blog) {
      return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
    }

    const commentId = String(req.params.commentId || "").trim();
    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid comment id"));
    }

    const comment = await BlogComment.findOne({
      _id: commentId,
      blogId: blog._id,
      status: "ACTIVE",
    });
    if (!comment) {
      return res.status(404).json(new ApiResponse(404, null, "Comment not found"));
    }

    const isOwner = String(comment.userId) === String(req.user._id);
    const isAdmin = String(req.user.role || "").toUpperCase() === "ADMIN";
    if (!isOwner && !isAdmin) {
      return res.status(403).json(new ApiResponse(403, null, "Not allowed"));
    }

    comment.status = "DELETED";
    await comment.save();
    await Blog.updateOne(
      { _id: blog._id, commentCount: { $gt: 0 } },
      { $inc: { commentCount: -1 } },
    );

    const fresh = await Blog.findById(blog._id).select("commentCount").lean();
    return res.status(200).json(
      new ApiResponse(
        200,
        { commentCount: fresh?.commentCount || 0 },
        "Comment deleted",
      ),
    );
  } catch (error) {
    logError(error, req, 500, "blogEngagement.controller - deleteBlogComment");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to delete comment"));
  }
};
