import Service from "../../models/service.model.js";
import User from "../../models/user.model.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../notification.controller.js";

export const handleCancelApply = async (req, res) => {
  try {
    const { _id } = req.user;
    const { serviceId } = req.body;

    if (!_id || !serviceId)
      return sendError(res, 400, "User ID and Service ID are required.", req);

    const [service, user] = await Promise.all([
      Service.findById(serviceId),
      User.findById(_id),
    ]);
    if (!service) return sendError(res, 404, "Service not found.", req);
    if (!user) return sendError(res, 404, "User not found.", req);

    const { userApplication, mediatorApplication } = getUserApplications(
      service,
      _id,
    );
    if (!userApplication && !mediatorApplication)
      return sendError(res, 400, "You have not applied to this service.", req);

    const {
      isMediatorCancelling,
      isAppliedByMediator,
      mediatorId,
      workersArray,
    } = classifyApplication(userApplication, mediatorApplication, _id);

    service.appliedUsers = updateApplicationStatus(
      service.appliedUsers,
      isMediatorCancelling,
      isAppliedByMediator,
      _id,
      mediatorId,
      req,
    );
    await service.save();

    await updateStats(
      _id,
      workersArray,
      isMediatorCancelling,
      isAppliedByMediator,
      serviceId,
      mediatorId,
      req,
    );
    await sendNotifications(
      service,
      user,
      isMediatorCancelling,
      isAppliedByMediator,
      mediatorId,
      workersArray,
      req,
    );

    return res
      .status(200)
      .json({ success: true, message: "Application cancelled successfully." });
  } catch (error) {
    console.log("Req---", req);

    return sendError(res, 500, error.message || "Something went wrong.", req);
  }
};

const getUserApplications = (service, userId) => ({
  userApplication: service.appliedUsers.find(
    (item) =>
      item.user.toString() === userId.toString() && item.status === "PENDING",
  ),
  mediatorApplication: service.appliedUsers.find(
    (item) =>
      item.workers.some(
        (worker) =>
          worker?.worker.toString() === userId.toString() &&
          worker?.status === "PENDING",
      ) && item.status === "PENDING",
  ),
});

const classifyApplication = (userApplication, mediatorApplication, userId) => ({
  isMediatorCancelling: userApplication && userApplication.workers.length > 0,
  isAppliedByMediator: !!mediatorApplication,
  mediatorId: mediatorApplication ? mediatorApplication.user : null,
  workersArray: userApplication ? userApplication.workers : [],
});

const updateApplicationStatus = (
  appliedUsers,
  isMediatorCancelling,
  isAppliedByMediator,
  userId,
  mediatorId,
  req,
) => {
  return appliedUsers.map((item) => {
    try {
      if (
        isMediatorCancelling &&
        item.user.toString() === userId.toString() &&
        item.status === "PENDING"
      ) {
        // Mediator cancels -> update own status and all workers to "CANCELLED"
        item.status = "CANCELLED";
        item.workers.forEach((worker) => {
          worker.status = "CANCELLED"; // Update each worker's status
        });
      }

      if (
        isAppliedByMediator &&
        item.user.toString() === mediatorId.toString() &&
        item.status === "PENDING"
      ) {
        // If a worker cancels from a mediator application, update only their own status
        item.workers = item.workers.map((worker) => {
          if (worker.worker.toString() === userId.toString()) {
            worker.status = "CANCELLED";
          }
          return worker;
        });

        // If all workers are cancelled, set mediator's status to "CANCELLED"
        if (item.workers.every((worker) => worker.status === "CANCELLED")) {
          item.status = "CANCELLED";
        }
      }

      if (
        !isMediatorCancelling &&
        item.user.toString() === userId.toString() &&
        item.status === "PENDING"
      ) {
        // Normal worker cancellation
        item.status = "CANCELLED";
      }
    } catch (error) {
      logError(error, req);
    }
    return item;
  });
};

const updateStats = async (
  userId,
  workersArray,
  isMediatorCancelling,
  isAppliedByMediator,
  serviceId,
  mediatorId,
  req,
) => {
  try {
    if (isMediatorCancelling) {
      await updateUserStats(userId, "CANCEL_APPLY_BY_MEDIATOR_AS_MEDIATOR");
      await Promise.all(
        workersArray.map((workerId) =>
          updateUserStats(
            workerId,
            "CANCEL_APPLY_BY_MEDIATOR_WHEN_APPLIED_BY_MEDIATOR",
          ),
        ),
      );
    } else if (isAppliedByMediator) {
      await updateUserStats(
        userId,
        "CANCEL_APPLY_BY_WORKER_WHEN_APPLIED_BY_MEDIATOR",
      );

      if (mediatorId) {
        const mediatorApplication = await Service.findOne({
          _id: serviceId,
          "appliedUsers.user": mediatorId,
        }).select("appliedUsers");

        if (mediatorApplication) {
          const mediatorEntry = mediatorApplication.appliedUsers.find(
            (item) => item.user.toString() === mediatorId.toString(),
          );

          if (
            mediatorEntry &&
            mediatorEntry.workers.length === 1 &&
            mediatorEntry.workers[0].toString() === userId.toString()
          ) {
            await updateUserStats(
              mediatorId,
              "CANCEL_APPLY_BY_WORKER_AS_MEDIATOR",
            );
          }
        }
      }
    } else {
      await updateUserStats(
        userId,
        "CANCEL_APPLY_BY_WORKER_WHEN_APPLIED_INDIVIDUALLY",
      );
    }
  } catch (error) {
    logError(error, req); // ✅ Ensure req is passed
  }
};

const sendNotifications = async (
  service,
  user,
  isMediatorCancelling,
  isAppliedByMediator,
  mediatorId,
  workersArray,
  req,
) => {
  try {
    if (isMediatorCancelling) {
      await Promise.all(
        workersArray.map((workerId) =>
          handleSendNotificationController(
            workerId,
            getEnglishTitles()?.MEDIATOR_CANCELLED_APPLICATION,
            {
              mediatorName: user.name,
              serviceName: service.subType,
            },
            {
              actionBy: user._id,
              actionOn: workerId,
            },
            req,
          ).catch((err) =>
            console.error(`Notification error for worker ${workerId}:`, err),
          ),
        ),
      );
    } else if (isAppliedByMediator) {
      await handleSendNotificationController(
        mediatorId,
        getEnglishTitles()?.WORKER_CANCELLED_APPLICATION,
        {
          workerName: user.name,
          serviceName: service.subType,
        },
        {
          actionBy: user._id,
          actionOn: mediatorId,
        },
        req,
      ).catch((err) =>
        console.error(`Notification error for mediator ${mediatorId}:`, err),
      );
    }

    console.log("service.employer---", service.employer, isMediatorCancelling);
    
    await handleSendNotificationController(
      service.employer,
      getEnglishTitles()?.USER_CANCELLED_HIS_SERVICE_SELECTION,
      {
        workerName: isMediatorCancelling ? "Multiple workers" : user.name,
        serviceName: service.subType,
      },
      {
        actionBy: user._id,
        actionOn: service.employer,
      },
      req,
    ).catch((err) =>
      console.error(
        `Notification error for employer ${service.employer}:`,
        err,
      ),
    );
  } catch (error) {
    console.error("Error while sending notifications:", error);
    logError(error, req);
  }
};

const sendError = (res, status, message, req = null) => {
  logError(new Error(message), req, status);
  res.status(status).json({ success: false, message });
};
