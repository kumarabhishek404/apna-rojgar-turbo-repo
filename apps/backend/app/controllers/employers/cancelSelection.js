import Service from "../../models/service.model.js";
import User from "../../models/user.model.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../notification.controller.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleCancelSelectedUser = async (req, res) => {
  try {
    const { _id } = req.user; // Employer's ID
    const { serviceId, userId } = req.body;

    if (!_id || !serviceId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Employer ID, service ID, and user ID are required",
      });
    }

    const service = await getServiceWithEmployer(serviceId, _id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or not associated with the employer",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const selectedUser = findSelectedUser(service, userId);
    if (!selectedUser) {
      return res
        .status(400)
        .json({ success: false, message: "User was not selected yet" });
    }

    const statusUpdated = updateSelectedUserStatus(selectedUser);
    if (!statusUpdated) {
      return res
        .status(400)
        .json({ success: false, message: "User status cannot be updated" });
    }

    const workersArray = selectedUser.workers || [];

    try {
      await updateRequirementCount(
        service,
        workersArray.length ? workersArray : [userId],
      );
    } catch (error) {
      logError(new Error("Update requirement count failed"), req);
    }

    await service.save();

    try {
      await handleNotificationsAndStats(service, userId, workersArray, req);
    } catch (error) {
      logError(
        new Error(
          "Notification and stats update failed requirement count failed",
        ),
        req,
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "User status updated to REMOVED" });
  } catch (error) {
    logError(new Error("Cancelling selected worker failed"), req, 500);
    return res.status(500).json({
      success: false,
      message: "An error occurred while canceling the user",
    });
  }
};

const findSelectedUser = (service, userId) => {
  return service.selectedUsers.find(
    (selected) =>
      selected.user.toString() === userId && selected?.status === "SELECTED",
  );
};

const updateSelectedUserStatus = (selectedUser) => {
  console.log("selectedUser---", selectedUser);

  if (selectedUser.status === "SELECTED") {
    selectedUser.status = "REMOVED";
    return true;
  }
  return false;
};

const getServiceWithEmployer = async (serviceId, employerId) => {
  return Service.findOne({ _id: serviceId, employer: employerId }).populate(
    "employer",
    "name _id email mobile profilePicture",
  );
};

const updateRequirementCount = async (service, workerIds) => {
  const workers = await User.find({ _id: { $in: workerIds } });
  workers.forEach((worker) => {
    worker.skills?.forEach((skill) => {
      const requirementIndex = service.requirements.findIndex(
        (req) => req.name.toLowerCase() === skill.skill.toLowerCase(),
      );
      if (requirementIndex !== -1) {
        service.requirements[requirementIndex].count += 1;
      }
    });
  });
};

const handleNotificationsAndStats = async (
  service,
  userId,
  workersArray,
  req,
) => {
  let notificationPromises = [];
  let updatePromises = [];

  if (workersArray.length === 0) {
    updatePromises.push(
      updateUserStats(
        userId,
        "CANCEL_SELECTION_BY_EMPLOYER_WHEN_APPLIED_INDIVIDUALLY",
      ),
    );
    notificationPromises.push(
      sendNotification(
        userId,
        getEnglishTitles()?.REMOVE_YOUR_SELECTION_FROM_SERVICE_BY_EMPLOYER,
        service,
        req,
      ),
    );
  } else {
    updatePromises.push(
      updateUserStats(userId, "CANCEL_SELECTION_BY_EMPLOYER_AS_MEDIATOR"),
    );
    workersArray.forEach((workerId) => {
      updatePromises.push(
        updateUserStats(
          workerId,
          "CANCEL_SELECTION_BY_EMPLOYER_WHEN_APPLIED_BY_MEDIATOR",
        ),
      );
      notificationPromises.push(
        sendNotification(
          workerId,
          getEnglishTitles()?.REMOVE_YOUR_SELECTION_FROM_SERVICE_BY_EMPLOYER,
          service,
          req,
        ),
      );
    });
    notificationPromises.push(
      handleSendNotificationController(
        userId,
        getEnglishTitles()?.REMOVE_YOUR_SELECTION_AS_MEDIATOR,
        {
          serviceName: `${service?.type} ${service?.subType}`,
          workersCount: workersArray.length,
        },
        {
          actionBy: service.employer,
          actionOn: userId,
        },
        req,
      ),
    );
  }
  await Promise.all([...updatePromises, ...notificationPromises]);
};

const sendNotification = (userId, type, service, req) => {
  return handleSendNotificationController(
    userId,
    type,
    { serviceName: `${service?.type} ${service?.subType}` },
    {
      actionBy: service.employer,
      actionOn: userId,
    },
    req,
  );
};
