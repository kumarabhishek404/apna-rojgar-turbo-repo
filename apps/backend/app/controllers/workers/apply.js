import Service from "../../models/service.model.js";
import User from "../../models/user.model.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../notification.controller.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleApplyToService = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { serviceId, workers, skills } = req.body;
    const isMediator = Array.isArray(workers) && workers.length > 0;

    if (isMediator && workers.includes(userId.toString())) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot add yourself as a worker when applying as a mediator.",
      });
    }

    const service = await checkServiceAvailability(
      userId,
      serviceId,
      req,
      workers,
    );
    const user = await User.findById(userId);
    if (!user) {
      logError(new Error("User not found"), req, 400);
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const requiredSkills = service.requirements.map((req) =>
      req.name.toLowerCase(),
    );

    if (!isMediator) {
      if (!skills || !requiredSkills.includes(skills.toLowerCase())) {
        logError(new Error("Invalid or missing skill"), req, 400);
        return res.status(400).json({
          success: false,
          message:
            "Invalid or missing skill. Please select a skill from the service requirements.",
        });
      }

      const hasValidSkill = await validateUserSkills(
        userId,
        requiredSkills,
        req,
      );
      if (!hasValidSkill) {
        logError(new Error("User does not have the required skill"), req, 400);
        return res.status(400).json({
          success: false,
          message: "You do not have the required skill.",
        });
      }
      await applyAsWorker(user, service, skills, req);
    } else {
      await applyAsMediator(
        user,
        service,
        workers,
        skills,
        requiredSkills,
        req,
      );
    }

    res
      .status(200)
      .json({ success: true, message: "Successfully applied to the service." });
  } catch (error) {
    logError(error, req, 400);
    res.status(400).json({ success: false, message: error.message });
  }
};

const applyAsMediator = async (
  user,
  service,
  workers,
  skills,
  requiredSkills,
  req,
) => {
  try {
    console.log("Starting applyAsMediator function...");
    console.log("Received Workers:", workers);
    console.log("Received Skills:", skills);

    // Ensure workers list is valid
    if (!workers || !Array.isArray(workers) || workers.length === 0) {
      throw new Error("Workers list is required.");
    }

    // Ensure skills mapping is valid
    if (!skills || typeof skills !== "object") {
      throw new Error("Skills mapping is required.");
    }

    // Convert worker IDs to string and validate skills
    for (let workerId of workers) {
      workerId = workerId.toString(); // Ensure string format
      console.log(`Checking skill for worker ${workerId}:`, skills[workerId]);
      if (!skills[workerId]) {
        throw new Error(`Skill is missing for worker ID: ${workerId}`);
      }
    }

    // Fetch and validate workers
    const validWorkers = await getWorkersWithValidSkills(
      workers,
      Object.values(requiredSkills),
      req,
    );

    if (validWorkers.length !== workers.length) {
      throw new Error("Some workers do not have the required skills.");
    }

    // Ensure mediator has not already applied
    const alreadyApplied = service.appliedUsers.some(
      (entry) =>
        entry.user?.toString() === user._id.toString() &&
        entry.status === "PENDING" &&
        entry.workers.length > 0,
    );
    if (alreadyApplied) {
      throw new Error("Mediator has already applied.");
    }

    // ✅ Fix: Explicitly map `skill` correctly
    const appliedWorkers = validWorkers.map((worker) => {
      const workerIdStr = worker._id.toString();
      const assignedSkill = skills[workerIdStr];

      if (!assignedSkill) {
        throw new Error(`Skill is missing for worker ID: ${workerIdStr}`);
      }

      console.log(
        `Assigning skill "${assignedSkill}" to worker ${workerIdStr}`,
      );

      return {
        worker: worker._id,
        skill: assignedSkill, // ✅ Ensure skill is assigned properly
        status: "PENDING",
      };
    });

    // ✅ Fix: Ensure `skill: "MEDIATOR"` at the mediator level
    service.appliedUsers.push({
      user: user._id,
      skill: "MEDIATOR", // ✅ Fix: Add skill for mediator
      status: "PENDING",
      workers: appliedWorkers, // ✅ Workers array includes their own skills
    });

    console.log(
      "Final appliedUsers structure before saving:",
      JSON.stringify(service.appliedUsers, null, 2),
    );

    // Save to database
    await service.save();

    // Update user stats
    await updateUserStats(user._id, "APPLIED_IN_SERVICE_AS_MEDIATOR");
    await Promise.all(
      validWorkers.map((worker) =>
        updateUserStats(
          worker._id,
          "APPLIED_IN_SERVICE_WHEN_APPLIED_BY_MEDIATOR",
        ),
      ),
    );

    // Notify workers
    validWorkers.forEach((worker) =>
      handleSendNotificationController(
        worker._id,
        getEnglishTitles()?.YOU_HAVE_BEEN_APPLIED_BY_MEDIATOR,
        {
          serviceName: service.subType,
          mediatorName: user.name,
        },
        {
          actionBy: user._id,
          actionOn: worker._id,
        },
        req,
      ),
    );

    console.log("Application successful!");

    handleSendNotificationController(
      service.employer,
      getEnglishTitles()?.YOU_HAVE_APPLIED_AS_A_MEDIATOR,
      {
        serviceName: service.subType,
        mediatorName: user.name,
      },
      {
        actionBy: user._id,
        actionOn: service.employer,
      },
      req,
    );
  } catch (error) {
    console.error("❌ Error in applyAsMediator:", error.message);
    logError(error, req);
    throw error;
  }
};

const applyAsWorker = async (user, service, skill, req) => {
  try {
    const alreadyAppliedAsMediator = service.appliedUsers.some(
      (entry) =>
        entry.user?.toString() === user._id.toString() &&
        entry.status === "PENDING" &&
        entry.workers.length > 0,
    );
    if (alreadyAppliedAsMediator) {
      throw new Error(
        "You cannot apply as a worker after applying as a mediator.",
      );
    }

    const alreadyApplied = service.appliedUsers.some(
      (entry) =>
        entry.user?.toString() === user._id.toString() &&
        entry.status === "PENDING" &&
        entry.workers.length === 0,
    );
    if (alreadyApplied) {
      throw new Error("You have already applied.");
    }

    // ✅ Fix: Add `skill` at the top level (as required by schema)
    service.appliedUsers.push({
      user: user._id,
      skill: skill, // ✅ Required at the top level
      workers: [], // ✅ Required since workers array exists in schema
      status: "PENDING",
    });

    await service.save();

    await updateUserStats(
      user._id,
      "APPLIED_IN_SERVICE_WHEN_APPLIED_INDIVIDUALLY",
    );

    console.log("service-------------", service.employer);
    
    handleSendNotificationController(
      service.employer?._id,
      getEnglishTitles()?.APPLIED_IN_YOUR_SERVICE,
      {
        serviceName: service.subType,
        workerName: user.name,
      },
      {
        actionBy: user._id,
        actionOn: service.employer,
      },
      req,
    );
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

const checkServiceAvailability = async (
  userId,
  serviceId,
  req,
  workers = [],
) => {
  try {
    const service = await Service.findById(serviceId).populate(
      "employer",
      "name",
    );

    if (!service) throw new Error("Service not found.");

    // ✅ Fix: Ensure employer exists before accessing _id
    if (!service.employer) {
      throw new Error("Service has no employer assigned.");
    }

    // Check if user is the employer
    if (service.employer._id.toString() === userId.toString()) {
      throw new Error("You cannot apply to a service you created.");
    }

    // Check if user is applying with a team that includes the employer
    if (Array.isArray(workers) && workers.length > 0) {
      const employerId = service.employer._id.toString();
      const includesEmployer = workers.some(
        (workerId) => workerId.toString() === employerId,
      );
      if (includesEmployer) {
        throw new Error(
          "You cannot apply in the service which is created by your selected team member.",
        );
      }
    }

    // Check if service is open for hiring
    if (service.status !== "HIRING") {
      throw new Error("This service is not in a hiring state.");
    }

    return service;
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

const validateUserSkills = async (userId, requiredSkills, req) => {
  try {
    const user = await User.findById(userId).select("skills");
    if (!user || !user.skills) return false;
    return user.skills.some((skill) =>
      requiredSkills.includes(skill.skill.toLowerCase()),
    );
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

const getWorkersWithValidSkills = async (workers, requiredSkills, req) => {
  try {
    const workerDocs = await User.find({ _id: { $in: workers } }).select(
      "skills",
    );

    return workerDocs
      .map((worker) => {
        const matchingSkill = worker.skills.find((skill) =>
          requiredSkills.includes(skill.skill.toLowerCase()),
        );
        if (matchingSkill) {
          return { _id: worker._id, selectedSkill: matchingSkill.skill };
        }
        return null;
      })
      .filter(Boolean);
  } catch (error) {
    logError(error, req);
    throw error;
  }
};
