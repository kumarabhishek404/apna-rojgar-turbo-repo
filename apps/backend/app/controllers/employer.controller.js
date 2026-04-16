import Service from "../models/service.model.js";
import User from "../models/user.model.js";
import { handleSendNotificationController } from "./notification.controller.js";
import Invitation from "../models/invitation.model.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

export const handleDeleteService = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Service ID is required",
    });
  }

  try {
    // Fetch service and employer details
    const service = await Service.findById(id);
    const employer = await User.findById(_id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Ensure the user is the employer of the service
    if (service.employer.toString() !== _id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this service",
      });
    }

    // Mark service as cancelled
    await Service.findByIdAndUpdate(id, {
      status: "Cancelled",
    });

    // Fetch users who applied or were selected for this service
    const affectedUsers = await User.find({
      _id: { $in: [...service.appliedUsers, ...service.selectedUsers] },
    });

    // Notify affected users
    const notificationPromises = affectedUsers.map((user) =>
      handleSendNotificationController(
        user._id,
        getEnglishTitles()?.SERVICE_CANCELLED_BY_EMPLOYER,
        {
          serviceName: `${service?.type} ${service?.subType}`,
        },
        {
          actionBy: employer._id,
          actionOn: user._id,
        },
        req,
      ),
    );

    await Promise.all(notificationPromises);

    res.status(200).json({
      success: true,
      message:
        "Service cancelled successfully, and notifications sent to affected users",
    });
  } catch (error) {
    console.error(error);
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const getMyUploadedServices = async (req, res) => {
  const { _id } = req.user;
  let { page = 1, limit = 10, status } = req.query;

  // Convert page and limit to numbers
  page = Number(page);
  limit = Number(limit);

  try {
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    // Validate page and limit
    if (page <= 0 || limit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive numbers.",
      });
    }

    // Build query object
    const query = { employer: _id };

    // Add status filter if provided and valid
    if (status) {
      const validStatuses = ["HIRING", "COMPLETED", "CANCELLED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status. Must be one of: HIRING, COMPLETED, CANCELLED",
        });
      }
      query.status = status;
    }

    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalJobs = await Service.countDocuments(query);

    // If page number exceeds total pages, return last page
    const totalPages = Math.ceil(totalJobs / limit);
    if (totalJobs > 0 && page > totalPages) {
      page = totalPages;
    }

    // Fetch jobs with pagination
    let services = await Service.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Convert Mongoose documents to plain objects

    // Process services to update requirement counts
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        let updatedRequirements = [...service.requirements];
        const selectedWorkersCount = {};

        // Create a skill map for fast lookup in requirements
        const skillMap = updatedRequirements.reduce((acc, req) => {
          acc[req.name.toLowerCase()] = req;
          return acc;
        }, {});

        console.log("Processing service:", service._id);

        if (service.selectedUsers?.length > 0) {
          await Promise.all(
            service.selectedUsers.map(async (selectedUser) => {
              if (selectedUser.status === "SELECTED") {
                // 1. Handle Individual selectedUser (Mediator only)
                if (!selectedUser.workers?.length) {
                  console.log("Handling single mediator:", selectedUser.user);

                  const userDetails = await User.findById(
                    selectedUser.user,
                  ).select("skills");

                  console.log("User details fetched:", userDetails);

                  if (userDetails?.skills?.length > 0) {
                    userDetails.skills.forEach((skillObj) => {
                      const skillName = skillObj.skill.toLowerCase();
                      if (skillMap[skillName]) {
                        selectedWorkersCount[skillName] =
                          (selectedWorkersCount[skillName] || 0) + 1;
                      }
                    });
                  }
                }

                // 2. Handle selectedUser with workers (Only count workers with status "SELECTED")
                if (selectedUser.workers?.length) {
                  const selectedWorkerIds = selectedUser.workers
                    .filter((worker) => worker.status === "SELECTED") // Filter "SELECTED" workers
                    .map((worker) => worker._id); // Extract only worker IDs

                  console.log("selectedWorkerIds--", selectedWorkerIds);

                  if (selectedWorkerIds.length > 0) {
                    const workers = await User.find({
                      _id: { $in: selectedWorkerIds },
                    }).select("skills");

                    console.log("workers--", workers);

                    workers.forEach((worker) => {
                      if (worker?.skills?.length > 0) {
                        worker.skills.forEach((skillObj) => {
                          const skillName = skillObj.skill.toLowerCase();
                          if (skillMap[skillName]) {
                            selectedWorkersCount[skillName] =
                              (selectedWorkersCount[skillName] || 0) + 1;
                          }
                        });
                      }
                    });
                  }
                }
              }
            }),
          );
        }

        console.log("Selected Workers Count:", selectedWorkersCount);

        // Update requirements based on counted selected workers
        updatedRequirements = updatedRequirements.map((req) => {
          const skillName = req.name.toLowerCase();
          if (selectedWorkersCount[skillName]) {
            return {
              ...req,
              count: Math.max(0, req.count - selectedWorkersCount[skillName]), // Deduct count
            };
          }
          return req;
        });

        // ✅ FIX: Remove `.toObject()` since service is already a plain object
        return {
          ...service,
          requirements: updatedRequirements,
        };
      }),
    );

    res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      data: updatedServices,
      pagination: {
        page: page,
        pages: totalPages,
        total: totalJobs,
        limit: limit,
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

export const getAllSentInvitations = async (req, res) => {
  const { _id } = req.user;
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const totalInvitationCount = await Invitation.countDocuments({
      employer: _id,
      status: "PENDING",
    });

    const totalPages = Math.ceil(totalInvitationCount / limitNumber);

    const invitations = await Invitation.find({
      employer: _id,
      status: "PENDING",
    })
      .skip(skip)
      .limit(limitNumber)
      .populate({
        path: "bookedWorker",
        select:
          "_id name mobile email rating address profilePicture skills team",
      });

    res.status(200).json({
      success: true,
      message: "Fetched sent invitations successfully.",
      data: invitations,
      pagination: {
        page: pageNumber,
        pages: totalPages,
        total: totalInvitationCount,
        limit: limitNumber,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching sent invitations.",
      error: error.message,
    });
  }
};

export const getMyAllBookedWorker = async (req, res) => {
  const { _id } = req.user; // Employer's ID
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    // Fetch all services created by the employer (excluding CANCELLED & COMPLETED)
    let services = await Service.find({
      employer: _id,
      status: { $nin: ["CANCELLED", "COMPLETED"] }, // Exclude cancelled & completed bookings
    })
      .populate([
        {
          path: "selectedUsers.user",
          select: "_id name mobile email rating address profilePicture",
        },
        {
          path: "selectedUsers.workers.worker", // ✅ Ensure workers inside `selectedUsers` are fully populated
          select: "_id name mobile email rating address profilePicture",
        },
        {
          path: "bookedWorker",
          select: "_id name mobile email rating address profilePicture skills",
        },
      ])
      .lean(); // ✅ Convert to plain JSON for better performance

    // ✅ Filter services that have a bookedWorker OR a selectedUser with status "SELECTED"
    services = services?.filter((service) => {
      if (service.bookingType === "byService") {
        return service.selectedUsers.some(
          (selected) => selected.status === "SELECTED",
        );
      }
      return !!service.bookedWorker; // Allow only if bookedWorker exists
    });

    // Process services to format response correctly
    const formattedServices = services.map((service) => {
      let selectedUsers = [];
      let bookedWorker = null;

      console.log("services-------00000000", service?.selectedUsers);

      // Process selected users for "byService" booking
      if (service.bookingType === "byService") {
        selectedUsers = service.selectedUsers
          .filter((selected) => selected.status === "SELECTED")
          .map((selected) => {
            const mediatorWorkers =
              selected.workers?.map((w) => ({
                ...w.worker, // ✅ Assign full worker details (instead of just ID)
                skill: w.skill,
                status: w.status,
              })) || [];

            return {
              ...selected.user,
              status: selected.status,
              skill: mediatorWorkers.length > 0 ? "MEDIATOR" : "WORKER",
              workers: mediatorWorkers, // ✅ Now properly includes workers
            };
          });
      }

      // Process bookedWorker for "direct" booking
      if (service.bookingType === "direct" && service.bookedWorker) {
        const teamDetails = service.bookedWorker?.team || {};
        const teamWorkers = teamDetails?.workers || [];

        bookedWorker = {
          ...service.bookedWorker,
          role: teamWorkers.length > 0 ? "MEDIATOR" : "WORKER",
          team: teamWorkers.length > 0 ? teamWorkers : undefined,
        };
      }

      return {
        _id: service._id,
        jobID: service.jobID,
        status: service.status,
        employer: service.employer,
        type: service.type,
        subType: service.subType,
        images: service.images,
        description: service.description,
        startDate: service.startDate,
        duration: service.duration,
        address: service.address,
        requirements: service.requirements,
        appliedSkill: service?.appliedSkill,
        likedBy: service.likedBy,
        selectedUsers, // ✅ Includes workers under mediator
        bookedWorker,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        bookingType: service.bookingType,
      };
    });

    // ✅ Apply pagination after filtering
    const totalBookings = formattedServices.length;
    const paginatedServices = formattedServices.slice(
      skip,
      skip + Number(limit),
    );

    // ✅ If no bookings are found, return empty response instead of error
    return res.status(200).json({
      success: true,
      message:
        totalBookings > 0
          ? "Fetched all booked users with service details successfully."
          : "No active bookings found.",
      data: paginatedServices,
      pagination: {
        page: Number(page),
        pages: Math.ceil(totalBookings / limit),
        total: totalBookings,
        limit: Number(limit),
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booked workers.",
      error: error.message,
    });
  }
};

export const getAllUniqueSkills = async (req, res) => {
  try {
    const skills = await User.aggregate([
      // 1. Only process users that have at least one skill
      { $match: { "skills.0": { $exists: true } } },

      // 2. Break down the skills array into individual documents
      { $unwind: "$skills" },

      // 3. Group by the skill name ONLY to get unique strings
      {
        $group: {
          _id: null,
          // Use $addToSet on the specific 'skill' field (the name)
          uniqueSkillNames: { $addToSet: "$skills.skill" },
        },
      },

      // 4. Sort alphabetically (optional but professional)
      { $unwind: "$uniqueSkillNames" },
      { $sort: { uniqueSkillNames: 1 } },
      {
        $group: {
          _id: null,
          allSkills: { $push: "$uniqueSkillNames" },
        },
      },

      // 5. Final output format
      { $project: { _id: 0, allSkills: 1 } },
    ]);

    // Flatten to a simple array of strings
    const responseData = skills.length > 0 ? skills[0].allSkills : [];

    return res.status(200).json({
      success: true,
      count: responseData.length,
      data: responseData, // This will now be ["beldaarConstruction", "supervisor", ...]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching skills",
      error: error.message,
    });
  }
};
