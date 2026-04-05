import Invitation from "../../models/invitation.model.js";
import User from "../../models/user.model.js";
import Service from "../../models/service.model.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../notification.controller.js";
import { generateJobID } from "../../constants/functions.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleAcceptEmployerBookingRequest = async (req, res) => {
  try {
    const { _id } = req.user; // Worker ID
    const { invitationId } = req.body;

    // Fetch invitation
    const invitation = await findPendingInvitation(invitationId, _id);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found or already processed.",
      });
    }

    // Fetch employer and worker details
    const { employer, bookedWorker } = await fetchEmployerAndWorkerDetails(
      invitation.employer,
      _id
    );
    if (!employer || !bookedWorker) {
      return res.status(404).json({
        success: false,
        message: "Employer or worker not found.",
      });
    }

    // Check if already booked
    if (isAlreadyBooked(employer, bookedWorker, _id)) {
      return res.status(400).json({
        success: false,
        message: "You are already booked by this employer.",
      });
    }

    // Determine worker requirements
    const parsedRequirements = parseWorkerRequirements(
      req.body.requirements,
      bookedWorker,
      invitation.requiredNumberOfWorkers
    );

    // Remove employer ID from worker's booking request list
    await removeEmployerFromWorkerRequests(
      invitation.bookedWorker,
      invitation.employer
    );

    // Generate job ID and create service
    const jobID = await generateJobID();
    const service = await createService(invitation, jobID, parsedRequirements);

    // Update employer, worker, and invitation records
    await updateEmployerWorkerInvitation(
      employer._id,
      _id,
      service._id,
      invitation._id
    );

    // Send notification
    await sendEmployerNotification(employer, bookedWorker, invitation, req);

    return res.status(200).json({
      success: true,
      message: "Accepted the employer invitation successfully.",
      serviceId: service._id,
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while accepting the invitation.",
      error: error.message,
    });
  }
};

// Helper functions
const findPendingInvitation = async (invitationId, workerId) => {
  try {
    return await Invitation.findOne({
      _id: invitationId,
      bookedWorker: workerId,
      status: "PENDING",
    }).lean();
  } catch (error) {
    logError(error, req);
    return null;
  }
};

const fetchEmployerAndWorkerDetails = async (employerId, workerId) => {
  try {
    const employer = await User.findById(employerId)
      .select("myBookings name profilePicture email mobile")
      .lean();
    const bookedWorker = await User.findById(workerId)
      .select("bookedBy skills name profilePicture email mobile")
      .lean();
    return { employer, bookedWorker };
  } catch (error) {
    logError(error, req);
    return { employer: null, bookedWorker: null };
  }
};

const isAlreadyBooked = (employer, bookedWorker, workerId) => {
  return (
    employer.myBookings.includes(workerId) ||
    bookedWorker.bookedBy.includes(employer._id)
  );
};

const parseWorkerRequirements = (
  requirements,
  bookedWorker,
  requiredNumberOfWorkers
) => {
  if (!requirements || requirements.length === 0) {
    if (requiredNumberOfWorkers === 1) {
      const firstSkill = bookedWorker.skills?.[0] || {
        skill: "General Worker",
        pricePerDay: 0,
      };
      return [
        {
          name: firstSkill.skill,
          count: 1,
          payPerDay: firstSkill.pricePerDay,
          food: false,
          living: false,
          pf: false,
          insurance: false,
        },
      ];
    }
    return [];
  }
  return requirements;
};

const removeEmployerFromWorkerRequests = async (workerId, employerId) => {
  try {
    await User.findByIdAndUpdate(workerId, {
      $pull: { bookingRequestBy: employerId },
    });
  } catch (error) {
    logError(error, req);
  }
};

const createService = async (invitation, jobID, requirements) => {
  try {
    return await Service.create({
      ...invitation,
      jobID,
      bookingType: "direct",
      status: "HIRING",
      startDate: new Date(invitation?.startDate),
      requirements,
      appliedSkill: invitation?.appliedSkill,
    });
  } catch (error) {
    logError(error, req);
    return null;
  }
};

const updateEmployerWorkerInvitation = async (
  employerId,
  workerId,
  serviceId,
  invitationId
) => {
  try {
    await Promise.all([
      User.findByIdAndUpdate(employerId, { $push: { myBookings: serviceId } }),
      User.findByIdAndUpdate(workerId, {
        $push: { bookedBy: serviceId },
        $pull: { bookingRequestBy: employerId },
      }),
      Invitation.findByIdAndUpdate(invitationId, { status: "ACCEPTED" }),
      updateUserStats(employerId, "SERVICE_DIRECT_BOOKING_REQUEST_ACCEPTED"),
      updateUserStats(workerId, "WORK_DIRECT_BOOKING_REQUEST_ACCEPTED"),
    ]);
  } catch (error) {
    logError(error, req);
  }
};

const sendEmployerNotification = async (employer, bookedWorker, invitation, req) => {
  console.log("employer---", employer?._id, invitation);
  
  try {
    handleSendNotificationController(
      employer._id,
      getEnglishTitles()?.BOOKING_REQUEST_ACCEPTED_BY_USER,
      {
        workerName: bookedWorker.name,
        serviceName: invitation?.appliedSkill?.skill,
      },
      {
        actionBy: bookedWorker?._id,
        actionOn: employer?._id,
      },
      req
    );
  } catch (error) {
    logError(error, req);
  }
};
