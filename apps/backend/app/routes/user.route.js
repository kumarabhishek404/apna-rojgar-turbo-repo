import {
  getAllLikedUsers,
  getMyInfo,
  getUserDetails,
  getUsersOnRole,
  handleAddSkills,
  handleAddUserRating,
  handleDeleteUserRating,
  handleLikeUser,
  handleUnlikeUser,
  handleUpdateInfo,
  handleUpdateUserRating,
  handleUploadAvatar,
  handleLikeService,
  handleUnlikeService,
  getAllLikedServices,
  getAllUserRatings,
  getPendingUsers,
  getSuspendedUsers,
  handleDisableAccount,
  checkMobileNumberExistance,
  handleEnableAccount,
  handleAddSkill,
  handleRemoveSkill,
  handleGetDataOfTheState,
  handleDeleteAccount,
} from "../controllers/user.controller.js";
import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import checkAdmin from "../middlewares/checkRole.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";

const router = express.Router();

router.get("/info", verifyToken, getMyInfo);
router.patch(
  "/info",
  verifyToken,
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  handleUpdateInfo
);
router.post("/add-skill", verifyToken, userStatus, handleAddSkill);
router.post("/remove-skill", verifyToken, userStatus, handleRemoveSkill);
router
  .route("/upload-pic")
  .post(
    verifyToken,
    upload.fields([{ name: "profilePicture", maxCount: 1 }]),
    handleUploadAvatar
  );
router.delete("/disable-account", verifyToken, handleDisableAccount);
router.delete("/delete-account", verifyToken, handleDeleteAccount);


router.patch("/enable-account", verifyToken, handleEnableAccount);

router.post("/all", verifyToken, userStatus, getUsersOnRole);
router.get("/pending", verifyToken, userStatus, checkAdmin, getPendingUsers);
router.get(
  "/suspended",
  verifyToken,
  userStatus,
  checkAdmin,
  getSuspendedUsers
);
router.get("/detail/:id", verifyToken, userStatus, getUserDetails);

router.post("/like/:id", verifyToken, userStatus, handleLikeUser);
router.delete("/unlike/:id", verifyToken, userStatus, handleUnlikeUser);
router.get("/all-liked", verifyToken, userStatus, getAllLikedUsers);
router.post("/like-service", verifyToken, userStatus, handleLikeService);
router.post("/unlike-service", verifyToken, userStatus, handleUnlikeService);
router.get("/all-liked-services", verifyToken, userStatus, getAllLikedServices);

router.post("/add-skills", verifyToken, userStatus, handleAddSkills);

router.get("/ratings/:userId", verifyToken, userStatus, getAllUserRatings);
router.post("/rating/:userId", verifyToken, userStatus, handleAddUserRating);
router.put(
  "/rating/:userId/:ratingId",
  verifyToken,
  userStatus,
  handleUpdateUserRating
);
router.delete(
  "/rating/:userId/:ratingId",
  verifyToken,
  userStatus,
  handleDeleteUserRating
);

router.post("/check-mobile", checkMobileNumberExistance);

router.get("/state/:stateName", verifyToken, handleGetDataOfTheState);

export default router;
