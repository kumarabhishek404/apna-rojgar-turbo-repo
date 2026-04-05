import mongoose from "mongoose";
import Service from "../../models/service.model.js";
import User from "../../models/user.model.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../notification.controller.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleCancelBooking = async (req, res) => {
  const { serviceId } = req.body;
  const { _id, name } = req.user;

  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid service ID format",
    });
  }

  try {
    const service = await Service.findById(serviceId)
      .populate("employer", "name email mobile profilePicture myBookings")
      .populate(
        "bookedWorker",
        "name email mobile profilePicture pushToken myBookings bookedBy",
      )
      .populate(
        "selectedUsers.user",
        "name email mobile profilePicture pushToken myBookings",
      )
      .populate(
        "selectedUsers.workers",
        "name email mobile profilePicture pushToken myBookings",
      );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const isEmployer = service.employer._id.toString() === _id.toString();
    const isWorker = service.bookedWorker?._id.toString() === _id.toString();
    const isSelectedWorker =
      service.selectedUsers?.some(
        (user) =>
          user.user._id.toString() === _id.toString() &&
          user?.status === "SELECTED",
      ) || false;

    const isAppliedByMediator =
      service.selectedUsers?.some(
        (entry) =>
          entry.user &&
          entry?.status === "SELECTED" &&
          entry.workers.some(
            (worker) =>
              worker._id.toString() === _id.toString() &&
              worker?.status === "SELECTED",
          ),
      ) || false;

    if (!isEmployer && !isWorker && !isSelectedWorker && !isAppliedByMediator) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this service.",
      });
    }

    if (["CANCELLED", "COMPLETED"].includes(service.status)) {
      return res.status(400).json({
        success: false,
        message: `Service is already ${service.status.toLowerCase()}.`,
      });
    }

    let updatePromises = [];
    let notificationPromises = [];

    try {
      if (isEmployer) {
        await handleEmployerCancellation(
          service,
          _id,
          updatePromises,
          notificationPromises,
          req,
        );
      } else {
        await handleWorkerOrMediatorCancellation(
          service,
          _id,
          name,
          updatePromises,
          notificationPromises,
          req,
        );
      }

      await Promise.all([
        ...updatePromises,
        ...notificationPromises,
        service.save(),
      ]);

      return res.status(200).json({
        success: true,
        message: "Booking cancelled successfully.",
      });
    } catch (error) {
      logError(error, req);
      throw error;
    }
  } catch (error) {
    logError(error, req, 500);
    console.error("Error cancelling service:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while cancelling the booking.",
      error: error.message,
    });
  }
};

const handleEmployerCancellation = async (
  service,
  employerId,
  updatePromises,
  notificationPromises,
  req,
) => {
  try {
    service.status = "CANCELLED";
    updatePromises.push(updateUserStats(employerId, "SERVICE_CANCELLED"));

    let affectedWorkers = [];

    if (service.bookingType === "direct" && service.bookedWorker) {
      updatePromises.push(
        updateUserStats(
          service.bookedWorker._id,
          "WORK_DIRECT_BOOKING_CANCELLED_BY_EMPLOYER",
        ),
      );
      notificationPromises.push(
        handleSendNotificationController(
          service.bookedWorker._id,
          getEnglishTitles()?.SERVICE_DIRECT_BOOKING_CANCELLED_BY_EMPLOYER,
          { employerName: service.employer.name },
          {
            actionBy: service.employer,
            actionOn: service.bookedWorker._id,
          },
          req,
        ),
      );
    } else if (service.bookingType === "byService") {
      service.selectedUsers.forEach((selectedUser) => {
        const { user: mediator, workers } = selectedUser;
        affectedWorkers.push(mediator, ...workers);

        // If a mediator applied with workers, update both mediator and workers separately
        if (workers.length > 0) {
          updatePromises.push(
            updateUserStats(
              mediator._id,
              "CANCEL_SELECTION_BY_EMPLOYER_AS_MEDIATOR",
            ),
          );

          workers.forEach((worker) => {
            updatePromises.push(
              updateUserStats(
                worker._id,
                "CANCEL_SELECTION_BY_EMPLOYER_WHEN_APPLIED_BY_MEDIATOR",
              ),
            );
          });
        } else {
          // If an individual worker applied directly
          updatePromises.push(
            updateUserStats(
              mediator._id,
              "CANCEL_SELECTION_BY_EMPLOYER_WHEN_APPLIED_INDIVIDUALLY",
            ),
          );
        }
      });
    }

    // Update status instead of removing appliedUsers and selectedUsers
    if (service.appliedUsers.length > 0) {
      service.appliedUsers.forEach((appliedUser) => {
        if (appliedUser.status === "PENDING") {
          appliedUser.status = "SERVICE_CANCELLED";
          appliedUser.workers.forEach((worker) => {
            if (worker.status === "PENDING") {
              worker.status = "SERVICE_CANCELLED";
            }
          });
        }
      });
    }

    if (service.selectedUsers.length > 0) {
      service.selectedUsers.forEach((selectedUser) => {
        if (selectedUser.status === "SELECTED") {
          selectedUser.status = "SERVICE_CANCELLED";
          selectedUser.workers.forEach((worker) => {
            if (worker.status === "SELECTED") {
              worker.status = "SERVICE_CANCELLED";
            }
          });
        }
      });
    }

    // Update affected users and send notifications
    for (const worker of affectedWorkers) {
      updatePromises.push(
        User.findByIdAndUpdate(worker._id, {
          $pull: { myBookings: service._id },
        }),
      );

      notificationPromises.push(
        handleSendNotificationController(
          worker._id,
          getEnglishTitles()?.SERVICE_CANCELLED,
          { employerName: service.employer.name },
          {
            actionBy: service.employer,
            actionOn: worker._id,
          },
          req,
        ),
      );
    }

    handleAppliedUserStatsUpdate(service, updatePromises);
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

const handleWorkerOrMediatorCancellation = async (
  service,
  userId,
  name,
  updatePromises,
  notificationPromises,
  req,
) => {
  try {
    const userIndex = service.selectedUsers.findIndex(
      (user) =>
        user.user._id.toString() === userId.toString() &&
        user?.status === "SELECTED",
    );

    const workerEntry = service.selectedUsers.find((user) =>
      user.workers.some(
        (worker) => worker.worker._id.toString() === userId.toString(),
      ),
    );

    const isDirectlyBookedWorker =
      service?.bookingType === "direct" &&
      service?.bookedWorker?._id?.toString() === userId.toString();

    if (userIndex === -1 && !workerEntry && !isDirectlyBookedWorker) {
      throw new Error("You are not part of this booking or already removed.");
    }

    // 🟢 If the user is a mediator, update status
    if (userIndex !== -1) {
      const selectedUser = service.selectedUsers[userIndex];

      if (selectedUser.status === "SELECTED") {
        selectedUser.status = "CANCELLED";
      }

      updatePromises.push(
        updateUserStats(userId, "CANCEL_SELECTION_BY_MEDIATOR_AS_MEDIATOR"),
      );

      selectedUser.workers.forEach((worker) => {
        worker.status = "CANCELLED"; // Update individual worker status

        updatePromises.push(
          updateUserStats(
            worker.worker._id,
            "CANCEL_SELECTION_BY_MEDIATOR_WHEN_APPLIED_BY_MEDIATOR",
          ),
        );

        updatePromises.push(
          User.findByIdAndUpdate(worker.worker._id, {
            $pull: { myBookings: service._id },
          }),
        );

        notificationPromises.push(
          handleSendNotificationController(
            worker.worker._id,
            getEnglishTitles()?.BOOKING_CANCELLED_BY_MEDIATOR,
            { mediatorName: name },
            {
              actionBy: userId,
              actionOn: worker.worker._id,
            },
            req,
          ),
        );
      });
    }
    // 🟢 If the user is a worker under a mediator, update worker status
    else if (workerEntry) {
      const mediatorIndex = service.selectedUsers.findIndex(
        (user) => user.user._id.toString() === workerEntry.user._id.toString(),
      );
      const mediator = service.selectedUsers[mediatorIndex];

      mediator.workers = mediator.workers.map((worker) =>
        worker.worker._id.toString() === userId.toString()
          ? { ...worker, status: "CANCELLED" }
          : worker,
      );

      updatePromises.push(
        updateUserStats(
          userId,
          "CANCEL_SELECTION_BY_WORKER_WHEN_APPLIED_BY_MEDIATOR",
        ),
      );

      updatePromises.push(
        User.findByIdAndUpdate(userId, { $pull: { myBookings: service._id } }),
      );

      console.log("service.employer--12121--", service.employer);
      
      notificationPromises.push(
        handleSendNotificationController(
          service.employer._id,
          getEnglishTitles()?.BOOKING_CANCELLED_BY_USER,
          { workerName: name },
          {
            actionBy: userId,
            actionOn: service.employer._id,
          },
          req,
        ),
      );

      // 🟢 If all workers in mediator's list are cancelled, update mediator status
      if (mediator.workers.every((worker) => worker.status === "CANCELLED")) {
        mediator.status = "CANCELLED";
      }
    }

    // 🟢 If the user is a directly booked worker, update status
    if (isDirectlyBookedWorker) {
      updatePromises.push(
        updateUserStats(userId, "WORK_DIRECT_BOOKING_CANCELLED_BY_WORKER"),
      );

      updatePromises.push(
        updateUserStats(
          service.employer._id,
          "SERVICE_DIRECT_BOOKING_CANCELLED_BY_WORKER",
        ),
      );

      updatePromises.push(
        User.findByIdAndUpdate(userId, { $pull: { myBookings: service._id } }),
      );

      notificationPromises.push(
        handleSendNotificationController(
          service.employer._id,
          getEnglishTitles()?.BOOKING_CANCELLED_BY_USER,
          { workerName: name },
          {
            actionBy: userId,
            actionOn: service.employer._id,
          },
          req,
        ),
      );

      // 🟢 Instead of removing bookedWorker, set service status to CANCELLED
      updatePromises.push(
        Service.findByIdAndUpdate(service._id, { status: "CANCELLED" }),
      );
    }
  } catch (error) {
    logError(error, req);
    throw error;
  }
};

const handleAppliedUserStatsUpdate = (service, updatePromises) => {
  for (const applied of service.appliedUsers) {
    const appliedUser = applied.user;
    const appliedWorkers = applied.workers;

    if (appliedWorkers.length > 0) {
      updatePromises.push(
        updateUserStats(
          appliedUser._id,
          "CANCEL_APPLY_BY_EMPLOYER_AS_MEDIATOR",
        ),
      );
      appliedWorkers.forEach((worker) => {
        updatePromises.push(
          updateUserStats(
            worker._id,
            "CANCEL_APPLY_BY_EMPLOYER_WHEN_APPLIED_BY_MEDIATOR",
          ),
        );
      });
    } else {
      updatePromises.push(
        updateUserStats(
          appliedUser._id,
          "CANCEL_APPLY_BY_EMPLOYER_WHEN_APPLIED_INDIVIDUALLY",
        ),
      );
    }
  }
};
