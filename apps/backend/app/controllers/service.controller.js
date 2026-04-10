import mongoose from "mongoose";
import Service from "../models/service.model.js";
import State from "../models/state.model.js";
import User from "../models/user.model.js";
import logError from "../utils/addErrorLog.js";
import { haversineDistance } from "../utils/functions.js";

/**
 * Public paginated list of service `_id`s for Next static export (shareable `/services/:id` URLs).
 * No auth — only ObjectIds; details still require the existing authenticated service-info API in the browser.
 */
export const getPublicServiceIdsForStaticExport = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
    const skip = (page - 1) * limit;
    const query = {};
    const [rows, total] = await Promise.all([
      Service.find(query)
        .select("_id")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Service.countDocuments(query),
    ]);
    const pages = Math.ceil(total / limit) || 1;
    res.json({
      success: true,
      data: {
        ids: rows.map((r) => String(r._id)),
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Error fetching public service ids for static export:", error);
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong.",
    });
  }
};

/**
 * Public aggregate counters for website hero stats.
 * No auth required.
 */
export const getPublicPlatformStats = async (req, res) => {
  try {
    const [totalUsers, totalServices, cityStats] = await Promise.all([
      User.countDocuments(),
      Service.countDocuments(),
      User.aggregate([
        { $match: { status: "ACTIVE", address: { $type: "string", $ne: "" } } },
        {
          $project: {
            cityKey: {
              $toLower: {
                $trim: {
                  input: { $arrayElemAt: [{ $split: ["$address", ","] }, 0] },
                },
              },
            },
          },
        },
        { $match: { cityKey: { $ne: "" } } },
        { $group: { _id: "$cityKey" } },
        { $count: "totalCities" },
      ]),
    ]);
    const totalCities = cityStats?.[0]?.totalCities || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalServices,
        totalCities,
      },
    });
  } catch (error) {
    console.error("Error fetching public platform stats:", error);
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong.",
    });
  }
};

export const getAllServices = async (req, res) => {
  const { _id } = req.user;
  const { page = 1, limit = 10, status } = req.query;
  const { skills, distance, duration, serviceStartIn, state, district } =
    req.body;

  try {
    const skip = (page - 1) * limit;
    let query = { employer: { $ne: _id } };

    // Filter by status
    if (status) {
      if (status === "ACTIVE") {
        query.$or = [{ bookingType: "byService", status: "HIRING" }];
      } else if (["COMPLETED", "CANCELLED"].includes(status)) {
        query.status = status;
      }
    }

    // Filter by skills
    let skillsArray = [];
    if (skills) {
      skillsArray = Array.isArray(skills) ? skills : JSON.parse(skills);
      if (skillsArray.length > 0) {
        query.requirements = {
          $elemMatch: {
            name: {
              $in: skillsArray.map((skill) => new RegExp(`^${skill}$`, "i")),
            },
          },
        };
      }
    }

    // Filter by state/district in address
    if (state) query.address = { $regex: new RegExp(state, "i") };
    if (district) query.address = { $regex: new RegExp(district, "i") };

    // Get user's geoLocation for distance calculation
    const user = await User.findById(_id).select("likedServices geoLocation");
    const userLocation = user?.geoLocation;

    // Fetch services in one go
    let services = await Service.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(); // Use lean() to get plain objects and reduce memory overhead

    const totalServices = await Service.countDocuments(query);

    // Collect all user IDs involved in selected services
    const userIds = new Set();
    services.forEach((service) => {
      service.selectedUsers?.forEach((su) => {
        userIds.add(su.user.toString());
        su.workers?.forEach((w) => userIds.add(w._id.toString()));
      });
    });

    // Fetch all users once
    const usersMap = {};
    if (userIds.size > 0) {
      const users = await User.find({ _id: { $in: Array.from(userIds) } })
        .select("skills")
        .lean();
      users.forEach((u) => (usersMap[u._id.toString()] = u));
    }

    // Process services
    services = services.map((service) => {
      // Distance
      const serviceDistance =
        userLocation && service.geoLocation
          ? haversineDistance(userLocation, service.geoLocation)
          : null;

      // Skill counts
      const selectedWorkersCount = {};
      service.selectedUsers?.forEach((su) => {
        if (su.status === "SELECTED") {
          // Mediator without workers
          if (!su.workers?.length && usersMap[su.user]) {
            usersMap[su.user].skills?.forEach((skill) => {
              const skillName = skill.skill.toLowerCase();
              selectedWorkersCount[skillName] =
                (selectedWorkersCount[skillName] || 0) + 1;
            });
          }

          // Workers
          su.workers
            ?.filter((w) => w.status === "SELECTED")
            .forEach((w) => {
              if (usersMap[w._id]) {
                usersMap[w._id].skills?.forEach((skill) => {
                  const skillName = skill.skill.toLowerCase();
                  selectedWorkersCount[skillName] =
                    (selectedWorkersCount[skillName] || 0) + 1;
                });
              }
            });
        }
      });

      // Update requirements counts
      const updatedRequirements = service.requirements.map((req) => {
        const skillName = req.name.toLowerCase();
        if (selectedWorkersCount[skillName]) {
          return {
            ...req,
            count: Math.max(0, req.count - selectedWorkersCount[skillName]),
          };
        }
        return req;
      });

      return {
        ...service,
        distance: serviceDistance,
        requirements: updatedRequirements,
      };
    });

    // Filter by distance if provided
    if (distance) {
      const maxDistance =
        {
          within_10km: 10,
          within_50km: 50,
          within_100km: 100,
          anywhere: Infinity,
        }[distance] || Infinity;

      services = services.filter((s) => s.distance <= maxDistance);
    }

    // Filter by duration
    if (duration) {
      const maxDays =
        {
          less_5_days: 5,
          less_15_days: 15,
          less_one_month: 30,
          less_six_months: 180,
          any_duration: Infinity,
        }[duration] || Infinity;

      services = services.filter((s) => s.duration <= maxDays);
    }

    // Filter by service start-in
    if (serviceStartIn) {
      const today = new Date();
      const maxDaysMap = {
        within_one_month: 30,
        within_six_months: 180,
        within_one_year: 365,
        anytime: Infinity,
      };
      const maxDays = maxDaysMap[serviceStartIn] ?? Infinity;

      services = services.filter((s) => {
        const diff = (new Date(s.startDate) - today) / (1000 * 60 * 60 * 24);
        return diff <= maxDays;
      });
    }

    // Sort by nearest distance
    services.sort(
      (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
    );

    res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      data: services,
      pagination: {
        page: Number(page),
        pages: Math.ceil(totalServices / limit),
        total: totalServices,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong.",
    });
  }
};

export const getServiceDetail = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid service ID is required.",
      });
    }

    // Check if requester is the employer
    const isEmployer = await Service.exists({ _id: id, employer: userId });

    // Base populate fields
    const basePopulates = [
      {
        path: "bookedWorker",
        select:
          "name email profilePicture address mobile gender skills rating team",
      },
      {
        path: "appliedUsers.user",
        select:
          "name email profilePicture address mobile gender rating team skills",
      },
      {
        path: "appliedUsers.workers.worker",
        select: "name email profilePicture address mobile gender rating skills",
      },
      {
        path: "selectedUsers.user",
        select:
          "name email profilePicture address mobile gender rating team skills",
      },
      {
        path: "selectedUsers.workers.worker",
        select: "name email profilePicture address mobile gender rating skills",
      },
    ];

    // Team-level populate (for mediators)
    const teamPopulates = [
      {
        path: "appliedUsers.user.team",
        model: "Team",
        select: "workers",
        populate: {
          path: "workers",
          select:
            "_id name email profilePicture address mobile gender skills rating",
        },
      },
      {
        path: "selectedUsers.user.team",
        model: "Team",
        select: "workers",
        populate: {
          path: "workers",
          select:
            "_id name email profilePicture address mobile gender skills rating",
        },
      },
      {
        path: "bookedWorker.team",
        model: "Team",
        select: "workers",
        populate: {
          path: "workers",
          select:
            "_id name email profilePicture address mobile gender skills rating",
        },
      },
    ];

    // Fetch service
    const service = await Service.findById(id)
      .populate(
        isEmployer
          ? [...basePopulates, ...teamPopulates]
          : [
              {
                path: "employer",
                select:
                  "name email profilePicture address mobile gender skills rating",
              },
            ],
      )
      .lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    // Helper to normalize users (applied/selected)
    const formatUsers = (users = []) =>
      users.map((user) => ({
        ...user.user,
        status: user.status,
        skill: user?.skill,
        team:
          user.user?.team?.workers?.length > 0
            ? user.user.team.workers
            : undefined,
        workers:
          user.workers?.length > 0
            ? user.workers.map((w) => ({
                ...w.worker,
                skill: w.skill,
                status: w.status,
              }))
            : [],
      }));

    if (isEmployer) {
      const { attendance, ...filteredService } = service;

      return res.status(200).json({
        success: true,
        message: "Service detail fetched successfully",
        data: {
          ...filteredService,
          appliedUsers: formatUsers(service.appliedUsers),
          selectedUsers: formatUsers(service.selectedUsers),
          bookedWorker: service.bookedWorker
            ? {
                ...service.bookedWorker,
                role:
                  service.bookedWorker?.team?.workers?.length > 0
                    ? "MEDIATOR"
                    : "WORKER",
                team:
                  service.bookedWorker?.team?.workers?.length > 0
                    ? service.bookedWorker.team.workers
                    : undefined,
              }
            : null,
        },
      });
    }

    // For non-employers → restrict info
    return res.status(200).json({
      success: true,
      message: "Service detail fetched successfully",
      data: {
        ...service,
        employer: service.employer, // only employer info visible
      },
    });
  } catch (error) {
    console.error("Error fetching service details:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while fetching service.",
    });
  }
};

export const getAllAppliedUsers = async (req, res) => {
  const { serviceId } = req.params;

  if (!serviceId) {
    return res.status(400).json({
      success: false,
      message: "Service ID is missing",
    });
  }

  try {
    // Fetch service with pending appliedUsers and all required worker details
    const service = await Service.findById(serviceId)
      .populate({
        path: "appliedUsers.user",
        select: "name email profilePicture skills mobile address gender rating",
      })
      .populate({
        path: "appliedUsers.workers.worker",
        select: "name email profilePicture address mobile gender skills rating",
      });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Filter only "PENDING" status applied users
    const pendingAppliedUsers = service.appliedUsers
      .filter((application) => application.status === "PENDING")
      .map((application) => {
        const { user, workers, skill, additionalInfo } = application;

        return {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            mobile: user.mobile,
            address: user.address,
            gender: user.gender,
            rating: user.rating,
            skills: user.skills, // All skills of the mediator
            appliedSkill: skill, // The skill for which the mediator/worker applied
          },
          workers: workers.map((workerEntry) => ({
            _id: workerEntry.worker._id,
            name: workerEntry.worker.name,
            email: workerEntry.worker.email,
            profilePicture: workerEntry.worker.profilePicture,
            mobile: workerEntry.worker.mobile,
            address: workerEntry.worker.address,
            gender: workerEntry.worker.gender,
            rating: workerEntry.worker.rating,
            skills: workerEntry.worker.skills, // All skills of the worker
            appliedSkill: workerEntry.skill, // The specific skill the worker applied for
          })),
          additionalInfo, // Any extra details provided
        };
      });

    res.status(200).json({
      success: true,
      data: pendingAppliedUsers,
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "Error fetching applied users",
      error: error.message,
    });
  }
};

export const getAllSelectedUsers = async (req, res) => {
  const { serviceId } = req.params;

  if (!serviceId) {
    return res.status(400).json({
      success: false,
      message: "Service ID is missing",
    });
  }

  try {
    const service = await Service.findById(serviceId)
      .populate({
        path: "selectedUsers.user",
        select: "name email profilePicture skills mobile address gender rating",
      })
      .populate({
        path: "selectedUsers.workers.worker",
        select: "name email profilePicture address mobile gender skills rating",
      });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (!service.selectedUsers || service.selectedUsers.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // **Filter only users with status "SELECTED"**
    const selectedUsers = service.selectedUsers
      .filter(
        (application) =>
          application.status === "SELECTED" ||
          application.status === "SERVICE_COMPLETED",
      )
      .map(
        ({
          user,
          skill,
          workers,
          additionalInfo,
          status = application.status,
        }) => ({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            status: status,
            profilePicture: user.profilePicture,
            mobile: user.mobile,
            address: user.address,
            gender: user.gender,
            rating: user.rating,
            skills: user.skills,
            appliedSkill: skill,
          },
          workers: workers.map((workerEntry) => ({
            _id: workerEntry.worker._id,
            name: workerEntry.worker.name,
            email: workerEntry.worker.email,
            status: status,
            profilePicture: workerEntry.worker.profilePicture,
            mobile: workerEntry.worker.mobile,
            address: workerEntry.worker.address,
            gender: workerEntry.worker.gender,
            rating: workerEntry.worker.rating,
            skills: workerEntry.worker.skills, // All skills of the worker
            appliedSkill: workerEntry.skill, // The specific skill the worker was selected for
          })),
          additionalInfo, // Any extra details provided
        }),
      );

    return res.status(200).json({
      success: true,
      data: selectedUsers,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "Error fetching selected users",
      error: error.message,
    });
  }
};

export const getAllTheVillages = async (req, res) => {
  try {
    const { stateName } = req.body;

    console.log("StateName --", stateName);

    // Fetch state details from DB
    const stateData = await State.findOne({ state: stateName });

    if (!stateData) {
      return res.status(404).json({ message: "State not found" });
    }

    // Format the response
    const response = {
      state: stateName,
      districts: stateData.districts.map((district) => ({
        district: district.district,
        subDistricts: district.subDistricts.map((sub) => ({
          subDistrict: sub.subDistrict,
          villages: sub.villages,
        })),
      })),
    };

    res.json(response);
  } catch (error) {
    logError(error, req, 500);
    console.error("Error fetching villages:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// if (userId && service.employer.toString() === userId) {
//   // Employer fetching their own service - Do not populate employer details, only workers
//   populatedService = await service.populate([
//     {
//       path: "appliedUsers.user",
//       select:
//         "name email profilePicture address mobile gender skills rating",
//     },
//     {
//       path: "appliedUsers.workers",
//       select:
//         "name email profilePicture address mobile gender skills rating",
//     },
//     {
//       path: "selectedUsers.user",
//       select:
//         "name email profilePicture address mobile gender skills rating",
//     },
//     {
//       path: "selectedUsers.workers",
//       select:
//         "name email profilePicture address mobile gender skills rating",
//     },
//     {
//       path: "bookedWorker",
//       select:
//         "name email profilePicture address mobile gender skills rating",
//     },
//   ]);
// } else {
//   // Other users fetching the service - Only populate employer details
//   populatedService = await service.populate({
//     path: "employer",
//     select: "name email profilePicture address gender skills rating",
//   });
// }
