import Service from "../../models/service.model.js";
import User from "../../models/user.model.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../notification.controller.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleRejectApplication = async (req, res) => {
  const { _id } = req.user; // Employer's ID
  const { serviceId, userId } = req.body;

  if (!_id || !serviceId || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields." });
  }

  try {
    const service = await findServiceByEmployer(serviceId, _id);
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found." });
    }

    const appliedUser = findAppliedUser(service, userId);
    if (!appliedUser) {
      return res.status(400).json({
        success: false,
        message: "User did not apply for this service.",
      });
    }

    const statusUpdated = updateAppliedUserStatus(appliedUser);
    if (!statusUpdated) {
      return res
        .status(400)
        .json({ success: false, message: "User status cannot be updated" });
    }

    await service.save();

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const workersArray = await getWorkerIds(appliedUser.workers);

    await processRejectionActions(service, userId, workersArray, req);

    return res
      .status(200)
      .json({ success: true, message: "Application rejected successfully." });
  } catch (error) {
    logError(error, req, 500);
    res
      .status(500)
      .json({ success: false, message: "Error rejecting application." });
  }
};

const findServiceByEmployer = async (serviceId, employerId) => {
  try {
    return Service.findOne({ _id: serviceId, employer: employerId }).populate(
      "employer",
      "name _id email mobile profilePicture"
    );
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

const findAppliedUser = (service, userId) => {
  return service.appliedUsers.find(
    (applied) =>
      applied.user.toString() === userId && applied.status === "PENDING"
  );
};

const updateAppliedUserStatus = (appliedUser) => {
  try {
    if (appliedUser.status === "PENDING") {
      appliedUser.status = "REJECTED";
      return true;
    }
    return false;
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

const getWorkerIds = async (workers) => {
  try {
    if (!workers || workers.length === 0) return [];
    const workerDocs = await User.find({ _id: { $in: workers } });
    return workerDocs.map((worker) => worker._id);
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

const processRejectionActions = async (service, userId, workersArray, req) => {
  let updatePromises = [],
    notificationPromises = [];

  try {
    if (workersArray.length === 0) {
      updatePromises.push(
        updateUserStats(
          userId,
          "CANCEL_APPLY_BY_EMPLOYER_WHEN_APPLIED_INDIVIDUALLY"
        )
      );
      notificationPromises.push(sendRejectionNotification(userId, service, req));
    } else {
      updatePromises.push(
        updateUserStats(userId, "CANCEL_APPLY_BY_EMPLOYER_AS_MEDIATOR")
      );
      workersArray.forEach((workerId) => {
        updatePromises.push(
          updateUserStats(
            workerId,
            "CANCEL_APPLY_BY_EMPLOYER_WHEN_APPLIED_BY_MEDIATOR"
          )
        );
        notificationPromises.push(sendRejectionNotification(workerId, service));
      });
      notificationPromises.push(
        sendMediatorRejectionNotification(userId, service, workersArray.length, req)
      );
    }

    await Promise.all([...updatePromises, ...notificationPromises]);
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

const sendRejectionNotification = (userId, service, req) => {
  return handleSendNotificationController(
    userId,
    getEnglishTitles()?.REJECTED_FROM_SERVICE,
    { serviceName: `${service?.type} ${service?.subType}` },
    {
      actionBy: service?.employer?._id,
      actionOn: userId,
    },
    req
  );
};

const sendMediatorRejectionNotification = (userId, service, workersCount, req) => {
  return handleSendNotificationController(
    userId,
    getEnglishTitles()?.REJECTED_AS_MEDIATOR,
    { serviceName: `${service?.type} ${service?.subType}`, workersCount },
    {
      actionBy: service?.employer?._id,
      actionOn: userId,
    },
    req
  );
};
