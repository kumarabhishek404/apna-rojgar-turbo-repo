import User from "../models/user.model.js";

export async function updateUserStats(userId, actionType) {
  try {
    if (!userId || !actionType) {
      throw new Error("Missing userId or actionType in updateUserStats.");
    }

    const updateFields = getUpdateFields(actionType);

    if (!updateFields) {
      throw new Error(`Invalid action type: ${actionType}`);
    }

    // Update user stats
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      console.warn(`⚠️ No user found with ID: ${userId}`);
      return null;
    }

    return updatedUser;
  } catch (error) {
    console.error(`❌ Error updating user stats for ${userId}:`, error);
    throw error; // Propagate the error for higher-level handling
  }
}

/**
 * Returns the fields to update based on the action type.
 */
function getUpdateFields(actionType) {
  const updateForEmployer = {
    SERVICE_CREATED: {
      "serviceDetails.byService.total": 1,
      "serviceDetails.byService.pending": 1,
    },
    SERVICE_CANCELLED: {
      "serviceDetails.byService.cancelled": 1,
      "serviceDetails.byService.pending": -1,
    },
    COMPLETE_SERVICE_FOR_EMPLOYER: {
      "serviceDetails.byService.completed": 1,
      "serviceDetails.byService.pending": -1,
    },
  };

  const updateForWorkerWhenAppliedIndividually = {
    // APPLIED
    APPLIED_IN_SERVICE_WHEN_APPLIED_INDIVIDUALLY: {
      "workDetails.byService.appliedIndividually.total": 1,
      "workDetails.byService.appliedIndividually.applied": 1,
    },
    // CANCEL APPLIED
    CANCEL_APPLY_BY_WORKER_WHEN_APPLIED_INDIVIDUALLY: {
      "workDetails.byService.appliedIndividually.cancelledApply.byMySelf": 1,
      "workDetails.byService.appliedIndividually.applied": -1,
    },
    CANCEL_APPLY_BY_EMPLOYER_WHEN_APPLIED_INDIVIDUALLY: {
      "workDetails.byService.appliedIndividually.cancelledApply.byEmployer": 1,
      "workDetails.byService.appliedIndividually.applied": -1,
    },
    // SELECT WORKER
    SELECT_WORKER_WHEN_APPLIED_INDIVIDUALLY: {
      "workDetails.byService.appliedIndividually.selected": 1,
      "workDetails.byService.appliedIndividually.applied": -1,
    },
    // CANCEL SELECTION
    CANCEL_SELECTION_BY_WORKER_WHEN_APPLIED_INDIVIDUALLY: {
      "workDetails.byService.appliedIndividually.cancelledSelection.byMySelf": 1,
      "workDetails.byService.appliedIndividually.selected": -1,
    },
    CANCEL_SELECTION_BY_EMPLOYER_WHEN_APPLIED_INDIVIDUALLY: {
      "workDetails.byService.appliedIndividually.cancelledSelection.byEmployer": 1,
      "workDetails.byService.appliedIndividually.selected": -1,
    },
    // COMPLETE SERVICE
    COMPLETE_SERVICE_FOR_WORKER_WHEN_APPLIED_INDIVIDUALLY: {
      "workDetails.byService.appliedIndividually.completed": 1,
      "workDetails.byService.appliedIndividually.selected": -1,
    },
  };

  const updateForWorkerWhenAppliedByMediator = {
    // APPLIED
    APPLIED_IN_SERVICE_WHEN_APPLIED_BY_MEDIATOR: {
      "workDetails.byService.appliedByMediator.total": 1,
      "workDetails.byService.appliedByMediator.applied": 1,
    },

    // CANCEL APPLIED
    CANCEL_APPLY_BY_WORKER_WHEN_APPLIED_BY_MEDIATOR: {
      "workDetails.byService.appliedByMediator.cancelledApply.byMySelf": 1,
      "workDetails.byService.appliedByMediator.applied": -1,
    },
    CANCEL_APPLY_BY_MEDIATOR_WHEN_APPLIED_BY_MEDIATOR: {
      "workDetails.byService.appliedByMediator.cancelledApply.byMediator": 1,
      "workDetails.byService.appliedByMediator.applied": -1,
    },
    CANCEL_APPLY_BY_EMPLOYER_WHEN_APPLIED_BY_MEDIATOR: {
      "workDetails.byService.appliedByMediator.cancelledApply.byEmployer": 1,
      "workDetails.byService.appliedByMediator.applied": -1,
    },

    // SELECT WORKER
    SELECT_WORKER_WHEN_APPLIED_BY_MEDIATOR: {
      "workDetails.byService.appliedByMediator.selected": 1,
      "workDetails.byService.appliedByMediator.applied": -1,
    },

    // CANCEL SELECTION
    CANCEL_SELECTION_BY_WORKER_WHEN_APPLIED_BY_MEDIATOR: {
      "workDetails.byService.appliedByMediator.cancelledSelection.byMySelf": 1,
      "workDetails.byService.appliedByMediator.selected": -1,
    },
    CANCEL_SELECTION_BY_MEDIATOR_WHEN_APPLIED_BY_MEDIATOR: {
      "workDetails.byService.appliedByMediator.cancelledSelection.byMediator": 1,
      "workDetails.byService.appliedByMediator.selected": -1,
    },
    CANCEL_SELECTION_BY_EMPLOYER_WHEN_APPLIED_BY_MEDIATOR: {
      "workDetails.byService.appliedByMediator.cancelledSelection.byEmployer": 1,
      "workDetails.byService.appliedByMediator.selected": -1,
    },

    // COMPLETE SERVICE
    COMPLETE_SERVICE_FOR_WORKER_WHEN_APPLIED_BY_MEDIATOR: {
      "workDetails.byService.appliedByMediator.completed": 1,
      "workDetails.byService.appliedByMediator.selected": -1,
    },
  };

  const updateForMediator = {
    APPLIED_IN_SERVICE_AS_MEDIATOR: {
      "mediatorDetails.total": 1,
      "mediatorDetails.applied": 1,
    },
    CANCEL_APPLY_BY_MEDIATOR_AS_MEDIATOR: {
      "mediatorDetails.cancelledApply.byMySelf": 1,
      "mediatorDetails.applied": -1,
    },
    CANCEL_APPLY_BY_WORKER_AS_MEDIATOR: {
      "mediatorDetails.cancelledApply.byWorkers": 1,
      "mediatorDetails.applied": -1,
    },
    CANCEL_APPLY_BY_EMPLOYER_AS_MEDIATOR: {
      "mediatorDetails.cancelledApply.byEmployer": 1,
      "mediatorDetails.applied": -1,
    },
    SELECT_AS_MEDIATOR: {
      "mediatorDetails.selected": 1,
      "mediatorDetails.applied": -1,
    },
    CANCEL_SELECTION_BY_WORKER_AS_MEDIATOR: {
      "mediatorDetails.cancelledSelection.byWorkers": 1,
      "mediatorDetails.selected": -1,
    },
    CANCEL_SELECTION_BY_MEDIATOR_AS_MEDIATOR: {
      "mediatorDetails.cancelledSelection.byMySelf": 1,
      "mediatorDetails.selected": -1,
    },
    CANCEL_SELECTION_BY_EMPLOYER_AS_MEDIATOR: {
      "mediatorDetails.cancelledSelection.byEmployer": 1,
      "mediatorDetails.selected": -1,
    },
    COMPLETE_SERVICE_FOR_MEDIATOR: {
      "mediatorDetails.completed": 1,
      "mediatorDetails.selected": -1,
    },
  };

  const workDetailsDirectBookingActions = {
    WORK_DIRECT_BOOKING_REQUEST_RECEIVED: {
      "workDetails.directBooking.recievedRequests": 1,
      "workDetails.directBooking.bookingRequestPending": 1,
    },
    WORK_DIRECT_BOOKING_REQUEST_ACCEPTED: {
      "workDetails.directBooking.requestAccepted": 1,
      "workDetails.directBooking.bookingPending": 1,
      "workDetails.directBooking.bookingRequestPending": -1,
    },
    WORK_DIRECT_BOOKING_REQUEST_REJECTED: {
      "workDetails.directBooking.requestRejected": 1,
      "workDetails.directBooking.bookingRequestPending": -1,
    },
    WORK_DIRECT_BOOKING_REQUEST_CANCELLED: {
      "workDetails.directBooking.requestCancelled": 1,
      "workDetails.directBooking.bookingRequestPending": -1,
    },
    WORK_DIRECT_BOOKING_COMPLETED: {
      "workDetails.directBooking.bookingPending": -1,
      "workDetails.directBooking.bookingCompleted": 1,
    },
    WORK_DIRECT_BOOKING_CANCELLED_BY_WORKER: {
      "workDetails.directBooking.bookingCancelled.byMySelf": 1,
      "workDetails.directBooking.bookingPending": -1,
    },
    WORK_DIRECT_BOOKING_CANCELLED_BY_EMPLOYER: {
      "workDetails.directBooking.bookingCancelled.byEmployer": 1,
      "workDetails.directBooking.bookingPending": -1,
    },
  };

  const serviceDetailsDirectBookingActions = {
    SERVICE_DIRECT_BOOKING_REQUEST_SENT: {
      "serviceDetails.directBooking.sentRequests": 1,
      "serviceDetails.directBooking.bookingRequestPending": 1,
    },
    SERVICE_DIRECT_BOOKING_REQUEST_ACCEPTED: {
      "serviceDetails.directBooking.requestAccepted": 1,
      "serviceDetails.directBooking.bookingRequestPending": -1,
      "serviceDetails.directBooking.bookingPending": 1,
    },
    SERVICE_DIRECT_BOOKING_REQUEST_REJECTED: {
      "serviceDetails.directBooking.requestRejected": 1,
      "serviceDetails.directBooking.bookingRequestPending": -1,
    },
    SERVICE_DIRECT_BOOKING_REQUEST_CANCELLED: {
      "serviceDetails.directBooking.requestCancelled": 1,
      "serviceDetails.directBooking.bookingRequestPending": -1,
    },
    SERVICE_DIRECT_BOOKING_COMPLETED: {
      "serviceDetails.directBooking.bookingPending": -1,
      "serviceDetails.directBooking.bookingCompleted": 1,
    },
    SERVICE_DIRECT_BOOKING_CANCELLED_BY_WORKER: {
      "serviceDetails.directBooking.bookingCancelled.byWorker": 1,
      "serviceDetails.directBooking.bookingPending": -1,
    },
    SERVICE_DIRECT_BOOKING_CANCELLED_BY_EMPLOYER: {
      "serviceDetails.directBooking.bookingCancelled.byMySelf": 1,
      "serviceDetails.directBooking.bookingPending": -1,
    },
  };

  return (
    updateForEmployer[actionType] ||
    updateForWorkerWhenAppliedIndividually[actionType] ||
    updateForWorkerWhenAppliedByMediator[actionType] ||
    updateForMediator[actionType] ||
    workDetailsDirectBookingActions[actionType] ||
    serviceDetailsDirectBookingActions[actionType] ||
    null
  );
}
