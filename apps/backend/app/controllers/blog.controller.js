import Blog, {
  buildBlogContentHash,
  slugifyBlogTitle,
} from "../models/blog.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logError from "../utils/addErrorLog.js";
import { publishNextPendingBlogFromGoogle } from "../utils/blogGoogleImport.js";

const PUBLIC_SELECT =
  "title slug excerpt content coverImageUrl status publishedAt authorName source createdAt updatedAt likeCount commentCount shareCount";

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let attempt = 0;
  while (attempt < 50) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Blog.exists(query);
    if (!exists) return slug;
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

async function assertNoDuplicate({ title, content, googleSourceId, excludeId }) {
  const contentHash = buildBlogContentHash(title, content);
  const or = [{ contentHash }];
  if (googleSourceId) or.push({ googleSourceId });

  const query = { $or: or };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await Blog.findOne(query).select("title slug googleSourceId contentHash");
  if (!existing) return contentHash;

  if (googleSourceId && existing.googleSourceId === googleSourceId) {
    const err = new Error("This Google Doc / sheet row was already imported");
    err.statusCode = 409;
    err.code = "DUPLICATE_GOOGLE_SOURCE";
    throw err;
  }

  const err = new Error(
    `Duplicate blog content matches existing post "${existing.title}" (${existing.slug})`,
  );
  err.statusCode = 409;
  err.code = "DUPLICATE_CONTENT";
  throw err;
}

export const listPublishedBlogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const search = String(req.query.search || "").trim();

    const filter = { status: "PUBLISHED" };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .select(PUBLIC_SELECT)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          blogs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.max(1, Math.ceil(total / limit)),
          },
        },
        "Blogs fetched successfully",
      ),
    );
  } catch (error) {
    logError(error, req, 500, "blog.controller - listPublishedBlogs");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to fetch blogs"));
  }
};

export const listPublishedBlogSlugs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));

    const filter = { status: "PUBLISHED" };
    const [rows, total] = await Promise.all([
      Blog.find(filter)
        .select("slug")
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          slugs: rows.map((row) => row.slug).filter(Boolean),
          pages: Math.max(1, Math.ceil(total / limit)),
        },
        "Blog slugs fetched",
      ),
    );
  } catch (error) {
    logError(error, req, 500, "blog.controller - listPublishedBlogSlugs");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to fetch blog slugs"));
  }
};

export const getPublishedBlogBySlug = async (req, res) => {
  try {
    const slug = String(req.params.slugOrId || "").trim().toLowerCase();
    if (!slug) {
      return res.status(400).json(new ApiResponse(400, null, "Blog slug is required"));
    }

    const or = [{ slug }];
    if (/^[a-f\d]{24}$/i.test(slug)) {
      or.push({ _id: slug });
    }

    const blog = await Blog.findOne({
      status: "PUBLISHED",
      $or: or,
    })
      .select(PUBLIC_SELECT)
      .lean();

    if (!blog) {
      return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, blog, "Blog fetched successfully"));
  } catch (error) {
    logError(error, req, 500, "blog.controller - getPublishedBlogBySlug");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to fetch blog"));
  }
};

export const listAdminBlogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "ALL").toUpperCase();

    const filter = {};
    if (status !== "ALL") filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          blogs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.max(1, Math.ceil(total / limit)),
          },
        },
        "Admin blogs fetched",
      ),
    );
  } catch (error) {
    logError(error, req, 500, "blog.controller - listAdminBlogs");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to fetch blogs"));
  }
};

export const getAdminBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).lean();
    if (!blog) {
      return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
    }
    return res.status(200).json(new ApiResponse(200, blog, "Blog fetched"));
  } catch (error) {
    logError(error, req, 500, "blog.controller - getAdminBlogById");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to fetch blog"));
  }
};

export const createAdminBlog = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();
    const excerpt = String(req.body.excerpt || "").trim();
    const coverImageUrl = String(req.body.coverImageUrl || "").trim();
    const status = String(req.body.status || "DRAFT").toUpperCase();
    const authorName = String(req.body.authorName || req.user?.name || "Apna Rojgar").trim();
    let slug = String(req.body.slug || "").trim().toLowerCase();

    if (!title || title.length < 3) {
      return res.status(400).json(new ApiResponse(400, null, "Title is required (min 3 chars)"));
    }
    if (!content || content.length < 20) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Content is required (min 20 chars)"));
    }
    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid status"));
    }

    if (!slug) slug = slugifyBlogTitle(title);
    slug = await ensureUniqueSlug(slug);

    let contentHash;
    try {
      contentHash = await assertNoDuplicate({ title, content });
    } catch (dupErr) {
      return res
        .status(dupErr.statusCode || 409)
        .json(new ApiResponse(dupErr.statusCode || 409, { code: dupErr.code }, dupErr.message));
    }

    const blog = await Blog.create({
      title,
      slug,
      excerpt:
        excerpt ||
        content.replace(/\s+/g, " ").trim().slice(0, 180) + (content.length > 180 ? "…" : ""),
      content,
      coverImageUrl,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      authorId: req.user?._id || null,
      authorName,
      source: "MANUAL",
      contentHash,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, blog, "Blog created successfully"));
  } catch (error) {
    if (error?.code === 11000) {
      return res
        .status(409)
        .json(new ApiResponse(409, null, "Duplicate blog (slug or content already exists)"));
    }
    logError(error, req, 500, "blog.controller - createAdminBlog");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to create blog"));
  }
};

export const updateAdminBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
    }

    const title =
      req.body.title !== undefined ? String(req.body.title || "").trim() : blog.title;
    const content =
      req.body.content !== undefined
        ? String(req.body.content || "").trim()
        : blog.content;
    const excerpt =
      req.body.excerpt !== undefined
        ? String(req.body.excerpt || "").trim()
        : blog.excerpt;
    const coverImageUrl =
      req.body.coverImageUrl !== undefined
        ? String(req.body.coverImageUrl || "").trim()
        : blog.coverImageUrl;
    const authorName =
      req.body.authorName !== undefined
        ? String(req.body.authorName || "").trim()
        : blog.authorName;
    const status =
      req.body.status !== undefined
        ? String(req.body.status || "").toUpperCase()
        : blog.status;

    if (!title || title.length < 3) {
      return res.status(400).json(new ApiResponse(400, null, "Title is required (min 3 chars)"));
    }
    if (!content || content.length < 20) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Content is required (min 20 chars)"));
    }
    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid status"));
    }

    let slug =
      req.body.slug !== undefined
        ? String(req.body.slug || "").trim().toLowerCase()
        : blog.slug;
    if (!slug) slug = slugifyBlogTitle(title);
    slug = await ensureUniqueSlug(slug, blog._id);

    let contentHash;
    try {
      contentHash = await assertNoDuplicate({
        title,
        content,
        googleSourceId: blog.googleSourceId,
        excludeId: blog._id,
      });
    } catch (dupErr) {
      return res
        .status(dupErr.statusCode || 409)
        .json(new ApiResponse(dupErr.statusCode || 409, { code: dupErr.code }, dupErr.message));
    }

    const wasPublished = blog.status === "PUBLISHED";
    blog.title = title;
    blog.slug = slug;
    blog.excerpt =
      excerpt ||
      content.replace(/\s+/g, " ").trim().slice(0, 180) + (content.length > 180 ? "…" : "");
    blog.content = content;
    blog.coverImageUrl = coverImageUrl;
    blog.authorName = authorName || blog.authorName;
    blog.status = status;
    blog.contentHash = contentHash;
    if (status === "PUBLISHED" && !wasPublished) {
      blog.publishedAt = new Date();
    }
    if (status !== "PUBLISHED") {
      blog.publishedAt = status === "PUBLISHED" ? blog.publishedAt : blog.publishedAt;
    }
    if (status === "DRAFT" || status === "ARCHIVED") {
      // keep publishedAt history if it was published before
    }

    await blog.save();

    return res
      .status(200)
      .json(new ApiResponse(200, blog, "Blog updated successfully"));
  } catch (error) {
    if (error?.code === 11000) {
      return res
        .status(409)
        .json(new ApiResponse(409, null, "Duplicate blog (slug or content already exists)"));
    }
    logError(error, req, 500, "blog.controller - updateAdminBlog");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to update blog"));
  }
};

export const deleteAdminBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, { id: req.params.id }, "Blog deleted"));
  } catch (error) {
    logError(error, req, 500, "blog.controller - deleteAdminBlog");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Failed to delete blog"));
  }
};

export const runGoogleBlogImportNow = async (req, res) => {
  try {
    const result = await publishNextPendingBlogFromGoogle();
    return res
      .status(200)
      .json(new ApiResponse(200, result, result.message || "Google blog import finished"));
  } catch (error) {
    logError(error, req, 500, "blog.controller - runGoogleBlogImportNow");
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Google blog import failed"));
  }
};
