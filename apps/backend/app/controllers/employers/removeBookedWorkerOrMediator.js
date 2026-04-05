import mongoose from "mongoose";
import Service from "../../models/service.model.js";
import User from "../../models/user.model.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../notification.controller.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleRemoveBookedWorkerOrMediator = async (req, res) => {
  try {
    const { _id, name, profilePicture, email, mobile } = req.user;
    const { userId, serviceId } = req.body;

    console.log('UserId--', userId, serviceId);
    
    if (!isValidObjectId(userId) || !isValidObjectId(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID or service ID format.",
      });
    }

    const service = await getService(serviceId, _id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or not in a removable state.",
      });
    }

    const { updateServiceQuery, isAppliedIndividually, isAppliedByMediator } =
      getUpdateQuery(service, userId);
    if (!updateServiceQuery) {
      return res.status(400).json({
        success: false,
        message: "User is not part of this booking or already removed.",
      });
    }

    await performUpdates(
      serviceId,
      userId,
      updateServiceQuery,
      { _id, name, profilePicture, email, mobile },
      isAppliedIndividually,
      isAppliedByMediator,
      req
    );

    res.status(200).json({
      success: true,
      message: `User successfully removed.`,
    });
  } catch (error) {
    logError(error, req, 500);
    console.error("Error removing booked user:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while removing the user.",
      error: error.message,
    });
  }
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getService = async (serviceId, employerId) => {
  try {
    return Service.findOne({
      _id: serviceId,
      employer: employerId,
      status: "HIRING",
    }).lean();
  } catch (error) {
    logError(error, req);
    return null;
  }
};

const getUpdateQuery = (service, userId) => {
  let isAppliedIndividually = false;
  let isAppliedByMediator = false;

  const updatedUsers = service.selectedUsers.map((selected) => {
    if (String(selected.user) === String(userId)) {
      isAppliedIndividually = true;
      if (selected.status === "SELECTED") {
        selected.status = "REMOVED";
      }
    }
    selected.workers.forEach((worker) => {
      if (String(worker._id) === String(userId)) {
        isAppliedByMediator = true;
        if (worker.status === "SELECTED") {
          worker.status = "REMOVED";
        }
      }
    });
    return selected;
  });

  return {
    updateServiceQuery: { selectedUsers: updatedUsers },
    isAppliedIndividually,
    isAppliedByMediator,
  };
};

const performUpdates = async (
  serviceId,
  userId,
  updateServiceQuery,
  employer,
  isAppliedIndividually,
  isAppliedByMediator,
  req
) => {
  try {
    const updatePromises = [
      Service.findByIdAndUpdate(serviceId, updateServiceQuery),
      User.findByIdAndUpdate(userId, { $pull: { bookedBy: serviceId } }),
      handleSendNotificationController(
        userId,
        getEnglishTitles()?.BOOKING_CANCELLED_BY_EMPLOYER,
        { employerName: employer.name },
        {
          actionBy: employer?._id,
          actionOn: userId,
        },
        req
      ),
    ];

    if (isAppliedIndividually) {
      updatePromises.push(
        updateUserStats(
          userId,
          "CANCEL_SELECTION_BY_EMPLOYER_WHEN_APPLIED_INDIVIDUALLY"
        )
      );
    }
    if (isAppliedByMediator) {
      updatePromises.push(
        updateUserStats(
          userId,
          "CANCEL_SELECTION_BY_EMPLOYER_WHEN_APPLIED_BY_MEDIATOR"
        )
      );
    }

    await Promise.all(updatePromises);
  } catch (error) {
    logError(error, req);
    throw error;
  }
};
