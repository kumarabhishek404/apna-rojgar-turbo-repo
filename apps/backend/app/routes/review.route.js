import {
  getAllUserReviews,
  handleAddUserReview,
  handleUpdateUserReview,
  handleDeleteUserReview,
} from "../controllers/review.controller.js";
import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/all/:userId", verifyToken, getAllUserReviews);
router.post("/add/:userId", verifyToken, handleAddUserReview);
router.put("/update/:userId", verifyToken, handleUpdateUserReview);
router.delete("/delete/:userId", verifyToken, handleDeleteUserReview);

export default router;
