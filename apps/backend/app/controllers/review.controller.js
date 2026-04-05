import db from "../models/index.js";
import logError from "../utils/addErrorLog.js";
const User = db.user;
const Review = db.review;

async function updateAverageRating(userId) {
  try {
    const reviews = await Review.find({ reviewee: userId });
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (reviews.length === 0) {
      user.rating.average = 0;
      user.rating.count = 0;
    } else {
      const totalScore = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      user.rating.average = Number((totalScore / reviews.length).toFixed(2));
      user.rating.count = reviews.length;
    }

    await user.save();
  } catch (error) {
    logError(error, req, 500);
    console.error("Error updating average rating:", error);
  }
}

export const handleAddUserReview = async (req, res) => {
  const { rating, comment, ratingType } = req.body;
  const { userId } = req.params;
  const { _id } = req.user;

  console.log(
    `[LOG] Request received: Add rating for userId=${userId} by userId=${_id}`
  );

  try {
    if (!rating || !ratingType || !comment) {
      console.log("[ERROR] Rating not provided");
      return res.status(400).json({
        success: false,
        message: "All fields are compulsory",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingReview = await Review.findOne({
      reviewer: _id,
      reviewee: userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Review already exists",
      });
    }

    const review = await Review.create({
      reviewer: _id,
      reviewee: userId,
      ratingType,
      rating,
      comment,
    });

    await updateAverageRating(userId);

    return res.status(200).json({
      success: true,
      message: "Review added successfully",
      data: review,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(400).json({
      success: false,
      message: error?.message || "Something went wrong while adding the review",
    });
  }
};

export const handleUpdateUserReview = async (req, res) => {
  const { rating, comment, ratingType } = req.body;
  const raterId = req.user._id;
  const { userId } = req.params;

  try {
    if (!rating || !ratingType || !comment) {
      return res.status(400).json({
        success: false,
        message: "All fields are compulsory",
      });
    }

    const review = await Review.findOne({
      reviewer: raterId,
      reviewee: userId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found for this user.",
      });
    }

    review.rating = rating;
    review.comment = comment;
    review.ratingType = ratingType;
    await review.save();

    await updateAverageRating(userId);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Error updating review",
    });
  }
};

export const handleDeleteUserReview = async (req, res) => {
  const { userId } = req.params;
  const raterId = req.user._id;

  try {
    const review = await Review.findOneAndDelete({
      reviewer: raterId,
      reviewee: userId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found for this user.",
      });
    }

    await updateAverageRating(userId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Error deleting review",
    });
  }
};

export const getAllUserReviews = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is missing",
    });
  }

  try {
    const reviews = await Review.find({ reviewee: userId })
      .populate({
        path: "reviewer",
        select: "_id name  email profilePicture",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalReviews = await Review.countDocuments({ reviewee: userId });
    const totalPages = Math.ceil(totalReviews / limit);

    return res.status(200).json({
      success: true,
      message: "Reviews retrieved successfully",
      data: reviews,
      pagination: {
        page,
        pages: totalPages,
        total: totalReviews,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "Server error occurred while fetching user reviews",
    });
  }
};
