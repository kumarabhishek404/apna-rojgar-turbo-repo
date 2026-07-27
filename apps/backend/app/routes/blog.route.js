import express from "express";
import {
  createAdminBlog,
  deleteAdminBlog,
  getAdminBlogById,
  getPublishedBlogBySlug,
  listAdminBlogs,
  listPublishedBlogSlugs,
  listPublishedBlogs,
  runGoogleBlogImportNow,
  updateAdminBlog,
} from "../controllers/blog.controller.js";
import {
  createBlogComment,
  deleteBlogComment,
  getBlogEngagement,
  listBlogComments,
  recordBlogShare,
  replyBlogComment,
  toggleBlogLike,
  updateBlogComment,
} from "../controllers/blogEngagement.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { optionalAuth } from "../middlewares/optionalAuth.middleware.js";
import checkAdmin from "../middlewares/checkRole.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";

const router = express.Router();

/** Public — no login required */
router.get("/", listPublishedBlogs);
router.get("/public/slugs", listPublishedBlogSlugs);

/** Engagement (specific routes before /:slugOrId) */
router.get("/:slugOrId/engagement", optionalAuth, getBlogEngagement);
router.get("/:slugOrId/comments", listBlogComments);
router.post("/:slugOrId/like", verifyToken, userStatus, toggleBlogLike);
router.post("/:slugOrId/share", recordBlogShare);
router.post("/:slugOrId/comments", verifyToken, userStatus, createBlogComment);
router.post(
  "/:slugOrId/comments/:commentId/replies",
  verifyToken,
  userStatus,
  replyBlogComment,
);
router.patch(
  "/:slugOrId/comments/:commentId",
  verifyToken,
  userStatus,
  updateBlogComment,
);
router.delete(
  "/:slugOrId/comments/:commentId",
  verifyToken,
  userStatus,
  deleteBlogComment,
);

router.get("/:slugOrId", getPublishedBlogBySlug);

export default router;

export const adminBlogRouter = express.Router();

adminBlogRouter.use(verifyToken, userStatus, checkAdmin);
adminBlogRouter.get("/", listAdminBlogs);
adminBlogRouter.post("/import/google-run", runGoogleBlogImportNow);
adminBlogRouter.get("/:id", getAdminBlogById);
adminBlogRouter.post("/", createAdminBlog);
adminBlogRouter.patch("/:id", updateAdminBlog);
adminBlogRouter.delete("/:id", deleteAdminBlog);
