import Service from "../../models/service.model.js";
import User from "../../models/user.model.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../notification.controller.js";

export const handleCompleteBooking = async (req, res) => {
  const { _id } = req.user;
  const { serviceId } = req.body;

  try {
    const service = await fetchServiceDetails(serviceId);
    if (!service) {
      logError(new Error("Service not found"), req, 404);
      return res
        .status(404)
        .json({ success: false, message: "Service not found." });
    }

    if (!isEmployerAuthorized(service, _id)) {
      logError(new Error("Unauthorized access attempt"), req, 403);
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    if (!isServiceCompletable(service)) {
      logError(new Error("Service is not in a completable state"), req, 400);
      return res.status(400).json({
        success: false,
        message: "Service is not in a completable state.",
      });
    }

    markServiceAsCompleted(service);
    handleAppliedUserStatusUpdate(service);
    handleSelectedUserStatusUpdate(service);

    await service.save();

    const { workerIds, individualWorkerIds, mediatorWorkerIds, mediatorIds } =
      categorizeWorkers(service);

    try {
      await updateUsersStats(
        _id,
        workerIds,
        individualWorkerIds,
        mediatorWorkerIds,
        mediatorIds,
        service
      );
    } catch (error) {
      logError(new Error("Update user stats failed"), req);
    }

    try {
      await sendCompletionNotifications(
        workerIds,
        individualWorkerIds,
        mediatorWorkerIds,
        mediatorIds,
        service,
        req
      );
    } catch (error) {
      logError(new Error("Send completion notifications failed"), req);
    }

    return res
      .status(200)
      .json({ success: true, message: "Booking successfully completed." });
  } catch (error) {
    logError(error, req, 500);
    return res
      .status(500)
      .json({ success: false, message: "Failed to complete the booking." });
  }
};

const fetchServiceDetails = async (serviceId) => {
  try {
    return await Service.findById(serviceId)
      .populate("employer", "name email mobile profilePicture")
      .populate("bookedWorker", "name email mobile profilePicture pushToken")
      .populate(
        "selectedUsers.user",
        "name email mobile profilePicture pushToken"
      )
      .populate(
        "selectedUsers.workers",
        "name email mobile profilePicture pushToken"
      );
  } catch (error) {
    logError(new Error("Fetch service details failed"), req);
    throw error;
  }
};

const isEmployerAuthorized = (service, employerId) => {
  return service.employer._id.toString() === employerId.toString();
};

const isServiceCompletable = (service) => {
  return ["PENDING", "HIRING"].includes(service.status);
};

const markServiceAsCompleted = (service) => {
  service.status = "COMPLETED";
  service.endDate = new Date();

  if (service.startDate) {
    const startDate = new Date(service.startDate);
    const endDate = new Date(service.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffInDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    service.duration = diffInDays < 1 ? 1 : Math.ceil(diffInDays);
  } else {
    service.duration = 1;
  }
};

const categorizeWorkers = (service) => {
  let workerIds = new Set();
  let individualWorkerIds = new Set();
  let mediatorWorkerIds = new Set();
  let mediatorIds = new Set();

  if (service.bookingType === "direct" && service.bookedWorker) {
    workerIds.add(service.bookedWorker._id.toString());
  } else {
    for (const selected of service.selectedUsers) {
      if (selected.workers.length > 0) {
        mediatorIds.add(selected.user._id.toString());
        selected.workers.forEach((worker) => {
          workerIds.add(worker._id.toString());
          mediatorWorkerIds.add(worker._id.toString());
        });
      } else {
        workerIds.add(selected.user._id.toString());
        individualWorkerIds.add(selected.user._id.toString());
      }
    }
  }
  return { workerIds, individualWorkerIds, mediatorWorkerIds, mediatorIds };
};

const updateUsersStats = async (
  _id,
  workerIds,
  individualWorkerIds,
  mediatorWorkerIds,
  mediatorIds,
  service
) => {
  try {
    const updatePromises = [
      User.findByIdAndUpdate(_id, {
        $addToSet: { serviceHistory: service._id },
      }),
      ...Array.from(workerIds).map((workerId) =>
        User.findByIdAndUpdate(workerId, {
          $addToSet: { workHistory: service._id },
        })
      ),
    ];

    handleAppliedUserStatsUpdate(service, updatePromises);
    await Promise.all(updatePromises);
  } catch (error) {
    logError(new Error("Update requirement count failed"), req);
  }

  if (service.bookingType === "direct") {
    updatePromises.push(
      updateUserStats(_id, "SERVICE_DIRECT_BOOKING_COMPLETED")
    );
    workerIds.forEach((workerId) =>
      updatePromises.push(
        updateUserStats(workerId, "WORK_DIRECT_BOOKING_COMPLETED")
      )
    );
  } else {
    updatePromises.push(updateUserStats(_id, "COMPLETE_SERVICE_FOR_EMPLOYER"));
    individualWorkerIds.forEach((workerId) =>
      updatePromises.push(
        updateUserStats(
          workerId,
          "COMPLETE_SERVICE_FOR_WORKER_WHEN_APPLIED_INDIVIDUALLY"
        )
      )
    );
    mediatorWorkerIds.forEach((workerId) =>
      updatePromises.push(
        updateUserStats(
          workerId,
          "COMPLETE_SERVICE_FOR_WORKER_WHEN_APPLIED_BY_MEDIATOR"
        )
      )
    );
    mediatorIds.forEach((mediatorId) =>
      updatePromises.push(
        updateUserStats(mediatorId, "COMPLETE_SERVICE_FOR_MEDIATOR")
      )
    );
  }

  // Call handleAppliedUserStatsUpdate before executing all promises
  handleAppliedUserStatsUpdate(service, updatePromises);

  await Promise.all(updatePromises);
};

const sendCompletionNotifications = async (
  workerIds,
  individualWorkerIds,
  mediatorWorkerIds,
  mediatorIds,
  service,
  req
) => {
  const notificationPromises = [];
  const employerData = {
    id: service.employer._id,
    name: service.employer.name,
    profilePicture: service.employer.profilePicture,
    email: service.employer.email,
    mobile: service.employer.mobile,
  };

  individualWorkerIds.forEach((workerId) => {
    notificationPromises.push(
      handleSendNotificationController(
        workerId,
        getEnglishTitles()?.SERVICE_COMPLETED,
        { employerName: service.employer.name },
        {
          actionBy: service.employer._id,
          actionOn: workerId,
        },
        req
      )
    );
  });

  mediatorWorkerIds.forEach((workerId) => {
    notificationPromises.push(
      handleSendNotificationController(
        workerId,
        getEnglishTitles()?.SERVICE_COMPLETED,
        { employerName: service.employer.name },
        {
          actionBy: service.employer._id,
          actionOn: workerId,
        },
        req
      )
    );
  });

  mediatorIds.forEach((mediatorId) => {
    notificationPromises.push(
      handleSendNotificationController(
        mediatorId,
        getEnglishTitles()?.SERVICE_COMPLETED_AS_MEDIATOR,
        {
          employerName: service.employer.name,
          workersCount: mediatorWorkerIds.size,
        },
        {
          actionBy: service.employer._id,
          actionOn: mediatorId,
        },
        req
      )
    );
  });

  await Promise.all(notificationPromises);
};

const handleAppliedUserStatsUpdate = (service, updatePromises) => {
  for (const applied of service.appliedUsers) {
    const appliedUser = applied.user;
    const appliedWorkers = applied.workers;

    if (appliedWorkers.length > 0) {
      updatePromises.push(
        updateUserStats(appliedUser._id, "CANCEL_APPLY_BY_EMPLOYER_AS_MEDIATOR")
      );
      appliedWorkers.forEach((worker) => {
        updatePromises.push(
          updateUserStats(
            worker._id,
            "CANCEL_APPLY_BY_EMPLOYER_WHEN_APPLIED_BY_MEDIATOR"
          )
        );
      });
    } else {
      updatePromises.push(
        updateUserStats(
          appliedUser._id,
          "CANCEL_APPLY_BY_EMPLOYER_WHEN_APPLIED_INDIVIDUALLY"
        )
      );
    }
  }
};

const handleAppliedUserStatusUpdate = (service) => {
  for (const applied of service.appliedUsers) {
    if (applied.status === "PENDING") {
      applied.status = "SERVICE_COMPLETED";
    }
    applied.workers.forEach((worker) => {
      if (worker.status === "PENDING") {
        worker.status = "SERVICE_COMPLETED";
      }
    });
  }
};

const handleSelectedUserStatusUpdate = (service) => {
  for (const selected of service.selectedUsers) {
    if (selected.status === "SELECTED") {
      selected.status = "SERVICE_COMPLETED";
    }
    selected.workers.forEach((worker) => {
      if (worker.status === "SELECTED") {
        worker.status = "SERVICE_COMPLETED";
      }
    });
  }
};
