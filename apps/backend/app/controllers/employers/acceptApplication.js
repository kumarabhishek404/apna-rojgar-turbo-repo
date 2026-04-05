import Service from "../../models/service.model.js";
import User from "../../models/user.model.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../notification.controller.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleAcceptApplication = async (req, res) => {
  const { _id } = req.user; // Employer's ID
  const { serviceId, userId } = req.body;

  if (!_id || !serviceId || !userId) {
    return res.status(400).json({
      success: false,
      message: "Employer ID, service ID, and user ID are required",
    });
  }

  try {
    const service = await getServiceById(serviceId, _id);
    if (!service) {
      await logError(
        new Error("Service not found or not associated with the employer"),
        req,
        404,
      );
      return res.status(404).json({
        success: false,
        message: "Service not found or not associated with the employer",
      });
    }

    const appliedUser = getAppliedUser(service, userId);
    if (!appliedUser) {
      await logError(
        new Error("User did not apply or application is not pending"),
        req,
        400,
      );
      return res.status(400).json({
        success: false,
        message:
          "User did not apply for this service or application is not pending",
      });
    }

    addUserToSelected(service, appliedUser);
    const user = await User.findById(userId);

    let workersArray;
    try {
      workersArray = await processUserAndWorkers(user, appliedUser, service);
    } catch (workerError) {
      await logError(workerError, req, 500);
      return res.status(500).json({
        success: false,
        message: "Error processing user and workers",
      });
    }

    await service.save();

    try {
      await sendNotificationsAndUpdateStats(service, userId, workersArray, req);
    } catch (notificationError) {
      await logError(notificationError, req);
    }

    return res.status(200).json({
      success: true,
      message: "User selected successfully and requirements updated",
    });
  } catch (error) {
    await logError(error, req, 500);
    res.status(500).json({
      success: false,
      message:
        error.message || "An error occurred while selecting the application",
    });
  }
};

const getServiceById = async (serviceId, employerId) => {
  return Service.findOne({ _id: serviceId, employer: employerId }).populate(
    "employer",
    "_id name email mobile profilePicture address",
  );
};

const getAppliedUser = (service, userId) => {
  const appliedUserIndex = service.appliedUsers.findIndex(
    (user) =>
      user?.user?.toString() === userId.toString() &&
      user?.status === "PENDING",
  );

  console.log("appliedUser--", service.appliedUsers, appliedUserIndex);

  if (appliedUserIndex !== -1) {
    const appliedUser = service.appliedUsers[appliedUserIndex];

    // Update mediator's status
    if (appliedUser.status === "PENDING") {
      service.appliedUsers[appliedUserIndex].status = "ACCEPTED";
    }

    // ✅ Update all workers' statuses from "PENDING" to "ACCEPTED"
    appliedUser.workers = appliedUser.workers.map((worker) => ({
      ...worker,
      status: "ACCEPTED",
    }));

    return appliedUser; // ✅ Return appliedUser with updated status
  }

  return null; // ✅ Return null if not found or status is not PENDING
};

const addUserToSelected = (service, appliedUser) => {
  // Check if the user is already in selectedUsers with status "SELECTED"
  const existingSelectedUser = service.selectedUsers.find(
    (su) =>
      su.user.toString() === appliedUser.user.toString() &&
      su.status === "SELECTED",
  );

  if (!existingSelectedUser) {
    // Move appliedUser to selectedUsers, preserving structure but updating status
    service.selectedUsers.push({
      ...appliedUser.toObject(), // Preserve existing fields
      workers: appliedUser.workers.map((worker) => ({
        ...worker.toObject(),
        status: "SELECTED", // Update worker status
      })),
      status: "SELECTED", // Update appliedUser status
    });
  }
};

const processUserAndWorkers = async (user, appliedUser, service) => {
  let workersArray = [];
  if (user) {
    // if (appliedUser.workers && appliedUser.workers.length > 0) {
    //   const workers = await User.find({ _id: { $in: appliedUser.workers } });
    //   workersArray = workers.map((worker) => worker._id);
    //   workers.forEach((worker) =>
    //     updateRequirementsCount(service, worker.skills)
    //   );
    // } else {
    //   updateRequirementsCount(service, user.skills);
    // }
    if (!user.myBookings.includes(service._id)) {
      user.myBookings.push(service._id);
    }
    await user.save();
  }
  return workersArray;
};

const sendNotificationsAndUpdateStats = async (
  service,
  userId,
  workersArray,
  req,
) => {
  let notificationPromises = [];
  let updatePromises = [];

  if (workersArray.length === 0) {
    updatePromises.push(
      updateUserStats(userId, "SELECT_WORKER_WHEN_APPLIED_INDIVIDUALLY"),
    );
    notificationPromises.push(
      sendNotification(
        userId,
        service,
        getEnglishTitles()?.SELECTED_IN_SERVICE,
        null,
        req,
      ),
    );
  } else {
    updatePromises.push(updateUserStats(userId, "SELECT_AS_MEDIATOR"));
    workersArray.forEach((workerId) => {
      updatePromises.push(
        updateUserStats(workerId, "SELECT_WORKER_WHEN_APPLIED_BY_MEDIATOR"),
      );
      notificationPromises.push(
        sendNotification(
          workerId,
          service,
          getEnglishTitles()?.SELECTED_IN_SERVICE,
          null,
          req,
        ),
      );
    });
    notificationPromises.push(
      sendNotification(
        userId,
        service,
        getEnglishTitles()?.SELECTED_AS_MEDIATOR,
        workersArray.length,
        req,
      ),
    );
  }

  await Promise.all([...updatePromises, ...notificationPromises]);
};

const sendNotification = (userId, service, type, workersCount = null, req) => {
  return handleSendNotificationController(
    userId,
    type,
    {
      serviceName: `${service?.subType}`,
      workersCount,
    },
    {
      actionBy: service?.employer?._id,
      actionOn: userId,
    },
    req,
  );
};
