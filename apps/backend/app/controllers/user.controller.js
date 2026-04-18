import mongoose from "mongoose";
import {
  // removeFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import Service from "../models/service.model.js";
import User from "../models/user.model.js";
import Team from "../models/team.model.js";
import State from "../models/state.model.js";
import logError from "../utils/addErrorLog.js";

// const SECRET = process.env.JWT_SECRET;

async function updateAverageRating(userId) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const ratings = user.ratings;
    if (ratings.length === 0) {
      user.averageRating = 0;
    } else {
      const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
      user.averageRating = totalScore / ratings.length;
    }

    await user.save();
  } catch (error) {
    logError(error, req);
    console.error("Error updating average rating:", error);
  }
}

export const getMyInfo = async (req, res) => {
  const { _id } = req.user;

  try {
    const user = await User.findById(_id)
      .populate("employedBy", "name mobile email")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Populate Work History
    const workHistory = await Service.find({
      _id: { $in: user.workHistory },
    }).select(
      "type subType bookingType status employer description startDate endDate duration address requirements attendance",
    );

    // ✅ Populate Service History
    const serviceHistory = await Service.find({
      _id: { $in: user.serviceHistory },
    }).select(
      "type subType bookingType status employer description startDate endDate duration address requirements attendance",
    );

    res.status(200).json({
      success: true,
      message: "User Info Fetched",
      data: {
        ...user._doc,
        workHistory,
        serviceHistory,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const handleUpdateInfo = async (req, res) => {
  try {
    const {
      _id,
      name,
      email,
      address,
      mobile,
      gender,
      age,
      locale,
      savedAddresses,
      geoLocation,
      role,
      skills,
    } = req.body;

    const parseSkillsInput = (rawSkills) => {
      if (!rawSkills) return null;
      if (Array.isArray(rawSkills)) {
        // Handle accidental shape: ["[{\"skill\":\"jutai\"}]"]
        if (
          rawSkills.length === 1 &&
          typeof rawSkills[0] === "string" &&
          rawSkills[0].trim().startsWith("[")
        ) {
          try {
            const parsed = JSON.parse(rawSkills[0]);
            return Array.isArray(parsed) ? parsed : null;
          } catch {
            return null;
          }
        }
        return rawSkills;
      }
      if (typeof rawSkills === "string") {
        try {
          const parsed = JSON.parse(rawSkills);
          return Array.isArray(parsed) ? parsed : null;
        } catch {
          return null;
        }
      }
      return null;
    };

    const normalizeGeoLocation = (rawGeoLocation) => {
      if (!rawGeoLocation) return null;
      let candidate = rawGeoLocation;
      if (typeof candidate === "string") {
        try {
          candidate = JSON.parse(candidate);
        } catch {
          return null;
        }
      }
      if (!candidate || typeof candidate !== "object") return null;
      const type = candidate.type === "Point" ? "Point" : null;
      const coordinates = Array.isArray(candidate.coordinates)
        ? candidate.coordinates.map((value) => Number(value))
        : null;
      if (
        !type ||
        !coordinates ||
        coordinates.length !== 2 ||
        !Number.isFinite(coordinates[0]) ||
        !Number.isFinite(coordinates[1])
      ) {
        return null;
      }
      return { type: "Point", coordinates };
    };
    const geocodeAddress = async (rawAddress) => {
      const safeAddress = typeof rawAddress === "string" ? rawAddress.trim() : "";
      if (!safeAddress) return null;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
            `${safeAddress}, India`,
          )}`,
        );
        const payload = await response.json();
        const first = Array.isArray(payload) ? payload[0] : null;
        if (!first?.lat || !first?.lon) return null;
        const lat = Number(first.lat);
        const lon = Number(first.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return { type: "Point", coordinates: [lon, lat] };
      } catch {
        return null;
      }
    };

    console.log("Fetching user from database");
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let updateData = {
      name,
      address,
      mobile,
      gender,
      age,
      locale,
      savedAddresses,
      role,
    };

    const parsedGeoLocation = normalizeGeoLocation(geoLocation);
    if (parsedGeoLocation) {
      updateData.geoLocation = parsedGeoLocation;
    } else {
      const geocodedFromAddress = await geocodeAddress(address || user?.address);
      if (geocodedFromAddress) {
        updateData.geoLocation = geocodedFromAddress;
      } else {
        // Heal legacy invalid geoLocation values stored as malformed strings.
        const existingGeoLocation = normalizeGeoLocation(user?.geoLocation);
        if (!existingGeoLocation) {
          updateData.geoLocation = { type: "Point", coordinates: [0, 0] };
        }
      }
    }

    // Update email if valid and changed
    if (
      email &&
      typeof email === "string" &&
      email.trim() !== "" &&
      email !== user.email?.value
    ) {
      updateData.email = {
        value: email.trim(),
        isVerified: false,
      };
    }

    // Hash password if provided
    // if (password) {
    //   if (user.password) {
    //     const isSame = await bcrypt.compare(password, user.password);
    //     if (!isSame) {
    //       updateData.password = await bcrypt.hash(password, 10);
    //     }
    //   } else {
    //     // User has no existing password, directly hash
    //     updateData.password = await bcrypt.hash(password, 10);
    //   }
    // }

    // Handle skills update from multipart/json body and normalize duplicates by skill id.
    const parsedSkills = parseSkillsInput(skills);
    if (parsedSkills) {
      const normalizedSkills = parsedSkills
        .map((item) => {
          if (!item) return null;
          if (typeof item === "string") {
            return { skill: item, pricePerDay: null };
          }
          if (typeof item === "object" && item.skill) {
            return {
              skill: item.skill,
              pricePerDay:
                item.pricePerDay == null || item.pricePerDay === ""
                  ? null
                  : Number(item.pricePerDay),
            };
          }
          return null;
        })
        .filter(Boolean);

      const uniqueBySkill = Array.from(
        new Map(normalizedSkills.map((item) => [String(item.skill), item])).values(),
      );
      updateData.skills = uniqueBySkill;
    }

    // Normalize address before saving
    const normalizeAddress = (addr) =>
      addr?.replace(/\s+/g, " ").trim().toLowerCase();

    // Handle savedAddresses
    if (savedAddresses) {
      const normalizedNewAddress = normalizeAddress(savedAddresses);
      const existingAddresses = user.savedAddresses || [];
      const isDuplicate = existingAddresses.some(
        (addr) => normalizeAddress(addr) === normalizedNewAddress,
      );

      updateData.savedAddresses = isDuplicate
        ? existingAddresses
        : [...existingAddresses, savedAddresses];
    }

    console.log("req.files[---", req.files);

    // Handle profile picture upload
    if (req.files && req.files["profileImage"]) {
      console.log("Uploading new profile image to Cloudinary");
      try {
        const profileImage = req.files["profileImage"][0];
        const uploadedImage = await uploadOnCloudinary(profileImage.path);
        updateData.profilePicture = uploadedImage;
        console.log("Profile image updated:", uploadedImage);
      } catch (uploadError) {
        console.error("Profile image upload failed", uploadError);
        // Optional: Do not throw, just skip profile update
      }
    }

    // ✅ Check required fields for status update (always, not just profile image)
    // const hasMobile = mobile || user.mobile;
    // const hasName = name || user.name;
    // const hasAddress = address || user.address;
    // const hasProfileImage = updateData.profilePicture || user.profilePicture;

    // console.log("Status validation ->", {
    //   hasMobile,
    //   hasName,
    //   hasAddress,
    //   hasProfileImage,
    // });

    // Check user's status instead of updateData.status
    // if (user.status !== "DISABLED") {
    //   updateData.status = determineUserStatus({
    //     hasMobile,
    //     hasName,
    //     hasAddress,
    //     hasProfileImage,
    //   });
    // }

    // Perform update
    const updatedUser = await User.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "User Info Updated",
      data: updatedUser,
      token,
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const handleAddSkill = async (req, res) => {
  const { _id } = req.user; // Current logged-in user ID
  const { skill } = req.body;

  // Input validation
  if (!skill || typeof skill !== "object" || !skill.skill) {
    return res.status(400).json({
      message: "A valid skill object with 'skill' is required.",
    });
  }

  try {
    // Fetch the user from the database
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if the skill already exists
    const skillExists = user.skills.some(
      (existingSkill) => existingSkill.skill === skill.skill,
    );

    if (skillExists) {
      return res.status(400).json({
        success: false,
        message: "This skill already exists for the user.",
      });
    }

    // // Push the new skill into the user's skills array
    // user.skills.push(skill);

    const updateData = {
      skills: [...user.skills, skill],
    };
    // Save the updated user
    // const updatedUser = await user.save();

    // Update the user document
    const updatedUser = await User.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to save the updated skills.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill added successfully.",
      data: updatedUser,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating skills.",
      error: error.message,
    });
  }
};

export const handleRemoveSkill = async (req, res) => {
  const { _id } = req.user; // Current logged-in user ID
  const { skillName } = req.body; // The skill to remove

  // Input validation
  if (!skillName || typeof skillName !== "string") {
    return res.status(400).json({
      success: false,
      message: "A valid skill name is required.",
    });
  }

  try {
    // Fetch the user from the database
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if the skill exists
    const skillExists = user.skills.some(
      (existingSkill) => existingSkill.skill === skillName,
    );

    if (!skillExists) {
      return res.status(400).json({
        success: false,
        message: "This skill does not exist for the user.",
      });
    }

    // Remove the skill from the user's skills array
    const updatedSkills = user.skills.filter(
      (existingSkill) => existingSkill.skill !== skillName,
    );

    // Update the user document with the modified skills array
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { skills: updatedSkills },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to remove the skill.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill removed successfully.",
      data: updatedUser,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "An error occurred while removing the skill.",
      error: error.message,
    });
  }
};

export const handleUploadAvatar = async (req, res) => {
  const { _id } = req.user;
  console.log("User ID:", _id);

  try {
    const profilePicture = req.files?.profilePicture;
    console.log("Avatar File Received:", profilePicture);

    if (!profilePicture || !profilePicture[0]) {
      console.error("No Profile Picture provided");
      return res.status(400).json({
        success: false,
        message: "Profile Picture is required",
      });
    }

    const profilePictureUrl = await uploadOnCloudinary(profilePicture[0].path);
    console.log("Avatar URL from Cloudinary:", profilePictureUrl);

    if (!profilePictureUrl?.url) {
      console.error("Failed to upload profile picture to Cloudinary");
      return res.status(500).json({
        success: false,
        message: "Failed to upload profile picture to Cloudinary",
      });
    }
    const user = await User.findById(_id);
    if (!user) {
      console.error("User not found in the database");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.profilePicture = profilePictureUrl.url;
    await user.save();
    console.log("User avatar updated successfully in the database");

    return res.status(200).json({
      success: true,
      message: "Profile Image Updated",
      data: profilePictureUrl.url,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the profile picture.",
      error: error?.message || "Unknown error",
    });
  }
};

export const handleDisableAccount = async (req, res) => {
  const { _id } = req.user;

  if (!_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "DISABLED") {
      return res.status(200).json({
        success: false,
        message: "Account is already disabled",
      });
    }

    await User.findByIdAndUpdate(_id, { status: "DISABLED" });

    return res.status(200).json({
      success: true,
      message: "Account disabled successfully",
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const handleDeleteAccount = async (req, res) => {
  const { _id } = req.user;

  if (!_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "DELETED") {
      return res.status(200).json({
        success: false,
        message: "Account is already deleted",
      });
    }

    await User.findByIdAndUpdate(_id, { status: "DELETED" });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const handleEnableAccount = async (req, res) => {
  const { _id } = req.user; // User ID from the authenticated request

  if (!_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "DISABLED") {
      return res.status(400).json({
        success: false,
        message: `Account cannot be enabled because it is currently (${user.status})`,
      });
    }

    await User.findByIdAndUpdate(_id, { status: "ACTIVE" });

    res.status(200).json({
      success: true,
      message: "Account enabled successfully",
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

const generateToken = (user) => {
  return jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "60d", // 2 months
  });
};

export const checkMobileNumberExistance = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({
      success: false,
      message: "Mobile number is required.",
    });
  }

  try {
    // Only select fields that are necessary for response & token
    const user = await User.findOne({ mobile })
      .select(
        "_id mobile name gender age address email aadhaarNumber profilePicture savedAddresses",
      )
      .lean();

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "Mobile number does not exist.",
        data: { exists: false },
      });
    }

    // Generate token only if user exists
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Mobile number exists.",
      data: {
        exists: true,
        user,
        token,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

export const getUsersOnRole = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const { skills, name, distance, completedServices, rating } = req.body;
    const loggedInUserId = req.user?._id;

    // Base match filter
    let match = { status: "ACTIVE", _id: { $ne: loggedInUserId } };

    // Role-based filtering — filter strictly by the user's stored role field
    if (role === "WORKER") {
      match.role = "WORKER";
    } else if (role === "MEDIATOR") {
      match.role = "MEDIATOR";
    } else if (role === "EMPLOYER") {
      match.role = "EMPLOYER";
    }

    // Skills filtering
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : JSON.parse(skills);
      if (skillsArray.length) {
        match["skills.skill"] = { $in: skillsArray };
      }
    }

    // Name filtering
    if (name) {
      match.name = { $regex: name, $options: "i" };
    }

    // Rating filtering
    if (rating) {
      const ratingNumber = Number(rating);
      if (!isNaN(ratingNumber) && ratingNumber >= 1 && ratingNumber <= 5) {
        match["rating.average"] = { $gte: ratingNumber };
      }
    }

    // Completed services filtering
    if (completedServices) {
      let completedFilter = 0;
      switch (completedServices) {
        case "more_than_10":
          completedFilter = 10;
          break;
        case "more_than_50":
          completedFilter = 50;
          break;
        case "more_than_100":
          completedFilter = 100;
          break;
        case "more_than_500":
          completedFilter = 500;
          break;
      }
      if (completedFilter > 0) {
        match.$expr = {
          $gte: [
            {
              $add: [
                {
                  $ifNull: [
                    "$workDetails.byService.appliedIndividually.completed",
                    0,
                  ],
                },
                {
                  $ifNull: [
                    "$workDetails.byService.appliedByMediator.completed",
                    0,
                  ],
                },
                { $ifNull: ["$workDetails.directBooking.bookingCompleted", 0] },
                { $ifNull: ["$mediatorDetails.completed", 0] },
              ],
            },
            completedFilter,
          ],
        };
      }
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: match },
      // Exclude admin users
      { $match: { mobile: { $nin: [process.env.ADMIN_MOBILE] } } },
    ];

    // Distance filtering (if logged in user has geoLocation)
    const loggedInUser =
      await User.findById(loggedInUserId).select("geoLocation");
    if (loggedInUser?.geoLocation && distance) {
      const maxDistanceKm =
        {
          within_10km: 10,
          within_50km: 50,
          within_100km: 100,
        }[distance] || 20000; // default max distance
      pipeline.push({
        $geoNear: {
          near: loggedInUser.geoLocation,
          distanceField: "distance",
          maxDistance: maxDistanceKm * 1000,
          spherical: true,
        },
      });
    }

    // Pagination
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    pipeline.push({ $skip: (parsedPage - 1) * parsedLimit });
    pipeline.push({ $limit: parsedLimit });

    const users = await User.aggregate(pipeline);

    const totalUsers = await User.countDocuments(match);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
      pagination: {
        page: parsedPage,
        pages: Math.ceil(totalUsers / parsedLimit),
        total: totalUsers,
        limit: parsedLimit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const getPendingUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalUsers = await User.countDocuments({ status: "PENDING" });
    const users = await User.find({ status: "PENDING" })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Pending users fetched successfully",
      data: users,
      pagination: {
        page,
        pages: Math.ceil(totalUsers / limit),
        total: totalUsers,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const getSuspendedUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalUsers = await User.countDocuments({ status: "SUSPENDED" });
    const users = await User.find({ status: "SUSPENDED" })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Suspended users fetched successfully",
      data: users,
      pagination: {
        page,
        pages: Math.ceil(totalUsers / limit),
        total: totalUsers,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    console.log(`[DEBUG] Aggregating full user details for ID: ${id}`);

    const userId = new mongoose.Types.ObjectId(id);

    const result = await User.aggregate([
      { $match: { _id: userId } },

      // Lookup full workHistory with employer info
      {
        $lookup: {
          from: "services",
          let: { workIds: "$workHistory" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$workIds"] } } },
            {
              $lookup: {
                from: "users",
                localField: "employer",
                foreignField: "_id",
                as: "employer",
              },
            },
            {
              $unwind: { path: "$employer", preserveNullAndEmptyArrays: true },
            },
          ],
          as: "workHistory",
        },
      },

      // Lookup team info
      {
        $lookup: {
          from: "teams",
          localField: "_id",
          foreignField: "mediator",
          as: "teamInfo",
        },
      },

      // Add team details
      {
        $addFields: {
          teamDetails: {
            $cond: {
              if: { $gt: [{ $size: "$teamInfo" }, 0] },
              then: {
                status: { $arrayElemAt: ["$teamInfo.status", 0] },
                memberCount: {
                  $size: { $arrayElemAt: ["$teamInfo.workers", 0] },
                },
              },
              else: { status: "noTeam", memberCount: 0 },
            },
          },
        },
      },

      // Remove temporary teamInfo array
      { $project: { teamInfo: 0 } },
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result[0];

    console.log(
      `[DEBUG] Fetched ${
        user.workHistory?.length || 0
      } services, team status: ${user.teamDetails?.status}`,
    );

    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: user,
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching user details.",
      error: error.message,
    });
  }
};

export const handleLikeUser = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;
  try {
    const user = await User.findById(id);
    const me = await User.findById(_id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    let alreadyLiked = false;

    alreadyLiked = me.likedUsers.includes(id);
    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: "You have already liked this employer.",
      });
    }
    me.likedUsers.addToSet(id);

    user.likedBy.addToSet(_id);

    await Promise.all([me.save(), user.save()]);

    return res
      .status(200)
      .json({ success: true, message: `user liked successfully.` });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Error in liking user",
    });
  }
};

export const handleUnlikeUser = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  try {
    const user = await User.findById(id);
    const me = await User.findById(_id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    let alreadyUnliked = false;

    alreadyUnliked = !me.likedUsers.includes(id);
    if (alreadyUnliked) {
      return res.status(400).json({
        success: false,
        message: "This employer is not in your liked list.",
      });
    }
    me.likedUsers.pull(id);

    user.likedBy.pull(_id);

    await Promise.all([me.save(), user.save()]);

    return res
      .status(200)
      .json({ success: true, message: `user unliked successfully.` });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Error in unliking user",
    });
  }
};

export const getAllLikedUsers = async (req, res) => {
  const { _id } = req.user;
  const { skill, pricePerDay } = req.query; // Both filters
  const page = parseInt(req.query.page) || null; // If not provided, set to null
  const limit = parseInt(req.query.limit) || null; // If not provided, set to null
  const skip = page && limit ? (page - 1) * limit : 0; // Only calculate skip if pagination params are provided

  console.log("Skill---", skill);
  console.log("PricePerDay---", pricePerDay);

  try {
    // Find the user by _id
    const user = await User.findById(_id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Build the match object for filtering by skill and pricePerDay
    const matchConditions = {
      ...(skill
        ? { "skills.skill": { $in: [skill] } } // Match the 'skill' property in likedUsers array of objects
        : {}),
      ...(pricePerDay ? { pricePerDay: { $lte: parseInt(pricePerDay) } } : {}),
    };

    console.log("matchConditions---", matchConditions);

    // Build populate options, including the filtering conditions
    const populateOptions = {
      match: matchConditions,
      ...(page && limit ? { options: { skip, limit } } : {}), // Apply pagination only if both page and limit are provided
    };

    console.log("populateOptions---", populateOptions);

    // Populate likedUsers with the filters applied
    const populatedUser = await user.populate({
      path: "likedUsers",
      ...populateOptions,
    });

    console.log("populatedUser---", populatedUser.likedUsers);

    // Get the total count of liked users with the skill and pricePerDay filters (if any)
    const totalCount = await User.findById(_id)
      .populate({ path: "likedUsers", match: matchConditions })
      .then((user) => user.likedUsers.length);

    // Respond with the liked users and pagination if applicable
    return res.status(200).json({
      success: true,
      data: populatedUser.likedUsers.filter((likedUser) => likedUser != null), // Remove null entries
      pagination:
        page && limit
          ? {
              page,
              pages: Math.ceil(totalCount / limit),
              total: totalCount,
              limit,
            }
          : {}, // Only include pagination if page and limit are provided
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const handleAddSkills = async (req, res) => {
  const { _id } = req.user;
  const { skills } = req.body;

  if (!skills || !Array.isArray(skills)) {
    return res.status(400).json({
      message: "Skills are required and should be an array.",
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      _id,
      { skills: skills },
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skills updated successfully.",
      data: user,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating skills.",
      error: error.message,
    });
  }
};

export const handleAddUserRating = async (req, res) => {
  const { score, comment } = req.body;
  const { userId } = req.params;
  const { _id } = req.user;

  console.log(
    `[LOG] Request received: Add rating for userId=${userId} by userId=${_id}`,
  );

  try {
    if (!score) {
      console.log("[ERROR] Score not provided");
      return res.status(400).json({
        success: false,
        message: "All fields are compulsory",
      });
    }

    const user = await User.findById(userId);
    console.log(
      `[LOG] Fetched user: ${user ? "User found" : "User not found"}`,
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingRating = user.ratings.find(
      (rating) => rating.user.toString() === _id.toString(),
    );
    if (existingRating) {
      console.log(`[ERROR] Rating already exists for userId=${_id}`);
      return res.status(400).json({
        success: false,
        message: "Rating already exists",
      });
    }

    const rating = {
      user: _id,
      score,
      comment,
    };

    user.ratings.push(rating);
    await user.save();

    console.log(`[LOG] Rating added successfully for userId=${userId}`);

    await updateAverageRating(userId);
    console.log(`[LOG] Average rating updated for userId=${userId}`);

    return res.status(200).json({
      success: true,
      message: "Rating added successfully",
    });
  } catch (error) {
    logError(error, req, 400);
    return res.status(400).json({
      success: false,
      message: error?.message || "Something went wrong while adding the rating",
    });
  }
};

export const handleUpdateUserRating = async (req, res) => {
  const { score, comment } = req.body;
  const raterId = req.user._id;
  const { userId } = req.params;
  try {
    if (!score) {
      return res.status(400).json({
        success: false,
        message: "All fields are compulsory",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const existingRating = user.ratings.find(
      (rating) => rating.user.toString() === raterId.toString(),
    );

    if (!existingRating) {
      return res
        .status(404)
        .json({ success: false, message: "Rating not found for this user." });
    }

    existingRating.score = score;
    existingRating.comment = comment;
    await user.save();

    await updateAverageRating(userId);

    return res
      .status(200)
      .json({ message: "Rating updated successfully", success: true });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Error updating rating",
    });
  }
};

export const handleDeleteUserRating = async (req, res) => {
  const { userId } = req.params;
  const raterId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const ratingIndex = user.ratings.findIndex(
      (rating) => rating.user.toString() === raterId.toString(),
    );

    if (ratingIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Rating not found for this user." });
    }

    user.ratings.splice(ratingIndex, 1);
    await user.save();

    await updateAverageRating(userId);

    res
      .status(200)
      .json({ success: false, message: "Rating deleted successfully" });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Error deleting rating",
    });
  }
};

export const handleLikeService = async (req, res) => {
  const { serviceId } = req.body;
  const { _id } = req.user;

  try {
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "Service ID is required.",
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    if (service.likedBy.includes(_id)) {
      return res.status(400).json({
        success: false,
        message: "Service already liked.",
      });
    }

    const user = await User.findByIdAndUpdate(
      _id,
      {
        $addToSet: { likedServices: serviceId },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // const updatedService = await Service.findByIdAndUpdate(
    //   serviceId,
    //   {
    //     $addToSet: { likedBy: _id },
    //   },
    //   { new: true },
    // );

    res.status(200).json({
      success: true,
      message: "Service liked successfully.",
      data: user,
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong.",
    });
  }
};

export const handleUnlikeService = async (req, res) => {
  const { serviceId } = req.body;
  const { _id } = req.user;

  try {
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "Service ID is required.",
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    if (!service.likedBy.includes(_id)) {
      return res.status(400).json({
        success: false,
        message: "Service not liked by the user.",
      });
    }
    const user = await User.findByIdAndUpdate(
      _id,
      {
        $pull: { likedServices: serviceId },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // const updatedService = await Service.findByIdAndUpdate(
    //   serviceId,
    //   {
    //     $pull: { likedBy: _id },
    //   },
    //   { new: true },
    // );

    res.status(200).json({
      success: true,
      message: "Service unliked successfully.",
      data: user,
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong.",
    });
  }
};

export const getAllLikedServices = async (req, res) => {
  const { _id } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const user = await User.findById(_id).select("likedServices");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const totalLikedServices = user.likedServices.length;

    const likedServices = await User.findById(_id)
      .select("likedServices")
      .populate({
        path: "likedServices",
        options: { skip, limit },
      })
      .select("-jobs");

    const totalPages = Math.ceil(totalLikedServices / limit);

    res.status(200).json({
      success: true,
      message: "Liked services fetched successfully.",
      data: likedServices.likedServices,
      pagination: {
        page: page,
        pages: totalPages,
        total: totalLikedServices,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong.",
    });
  }
};

export const getAllUserRatings = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is missing",
    });
  }

  try {
    const user = await User.findById(userId)
      .populate({
        path: "ratings.user",
        select: "_id name  email profilePicture",
      })
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const ratings = user.ratings;

    return res.status(200).json({
      success: true,
      message: "Ratings retrieved successfully",
      data: ratings,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "Server error occurred while fetching user ratings",
    });
  }
};

export const handleGetDataOfTheState = async (req, res) => {
  const { stateName } = req.params;

  try {
    const normalizedStateName = stateName.replace(/\s+/g, "").toLowerCase();

    console.log("stateName--", stateName, normalizedStateName);
    // Find the state document by name (case-insensitive)
    const stateData = await State.findOne({ state: stateName });

    console.log("stateData--", stateData);

    if (!stateData) {
      return res.status(404).json({ message: "State not found" });
    }

    res.json(stateData);
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({ message: "Internal server error" });
  }
};
