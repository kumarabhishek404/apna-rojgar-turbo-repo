import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { updateUserStats } from "../../utils/updateState.js";
import { handleSendNotificationController } from "../../controllers/notification.controller.js";
import User from "../../models/user.model.js";
import Invitation from "../../models/invitation.model.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";

export const handleSendBookingRequestToWorkerOrMediator = async (req, res) => {
  try {
    const { _id } = req.user;
    const invitationData = validateAndExtractData(req, res, _id);
    if (!invitationData) return;
    
    const { userId } = invitationData;
    const user = await findUserById(userId, res, "Worker not found", req);
    const employer = await findUserById(_id, res, "Employer not found", req);
    if (!user || !employer) return;

    if (employer.myBookings.includes(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Worker is already booked" });
    }

    const savedImages = await processImages(req, res);
    if (savedImages === null) return;

    const newInvitation = await createInvitation(
      _id,
      invitationData,
      savedImages,
      res,
      req
    );
    if (!newInvitation) return;

    await updateUserStats(_id, "SERVICE_DIRECT_BOOKING_REQUEST_SENT");
    await updateUserStats(userId, "WORK_DIRECT_BOOKING_REQUEST_RECEIVED");
    
    await sendInvitationNotification(userId, employer, invitationData, req);

    await User.findByIdAndUpdate(userId, {
      $addToSet: { bookingRequestBy: _id },
    });

    res.status(200).json({
      success: true,
      message: "Booking invitation sent successfully",
      data: newInvitation,
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending the booking invitation",
      error: error.message || "Unknown error",
    });
  }
};

const validateAndExtractData = (req, res, employerId) => {
  const {
    userId,
    startDate,
    type,
    subType,
    appliedSkill,
    duration,
    facilities,
    description,
    address,
    requiredNumberOfWorkers,
  } = req.body;

  if (employerId.toString() === userId.toString()) {
    res.status(400).json({
      success: false,
      message: "You cannot send an invitation to yourself.",
    });
    return null;
  }

  if (!userId || !startDate || !appliedSkill || !duration || !address || !requiredNumberOfWorkers) {
    res.status(400).json({
      success: false,
      message: "All fields are required except description.",
    });
    return null;
  }

  return {
    userId,
    startDate,
    type,
    subType,
    appliedSkill,
    duration,
    facilities,
    description,
    address,
    requiredNumberOfWorkers,
  };
};

const findUserById = async (userId, res, errorMessage, req) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: errorMessage });
      return null;
    }
    return user;
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "Error finding user",
      error: error.message,
    });
    return null;
  }
};

const processImages = async (req, res) => {
  try {
    const images = req.files?.images || [];
    const savedImages = [];

    for (const image of images) {
      try {
        const uploadedImage = await uploadOnCloudinary(image.path);
        if (uploadedImage) {
          savedImages.push(uploadedImage);
        } else {
          throw new Error("Image upload failed");
        }
      } catch (uploadError) {
        logError(uploadError, req, 500);
        res.status(500).json({
          success: false,
          message: "Error uploading image to Cloudinary",
          error: uploadError.message,
        });
        return null;
      }
    }
    return savedImages;
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "Error processing images",
      error: error.message,
    });
    return null;
  }
};

const createInvitation = async (
  employerId,
  invitationData,
  images,
  res,
  req
) => {
  try {
    return await Invitation.create({
      employer: employerId,
      bookedWorker: invitationData.userId,
      startDate: invitationData.startDate,
      type: invitationData.type,
      subType: invitationData.subType,
      appliedSkill: JSON.parse(invitationData?.appliedSkill),
      duration: invitationData.duration,
      facilities: JSON.parse(invitationData.facilities),
      description: invitationData.description || "",
      address: invitationData.address,
      images,
      requiredNumberOfWorkers: invitationData.requiredNumberOfWorkers ?? [],
      status: "PENDING",
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: "Error while creating invitation",
      error: error.message,
    });
    return null;
  }
};

const sendInvitationNotification = async (userId, employer, invitationData, req) => {
  console.log("Send Notification to the user --", userId);
  
  try {
    handleSendNotificationController(
      userId,
      getEnglishTitles()?.GET_A_BOOKING_INVITATION_FROM_EMPLOYER,
      {
        employerName: employer.name,
        serviceName: JSON.parse(invitationData?.appliedSkill)?.skill,
      },
      {
        actionBy: employer?._id,
        actionOn: userId,
      },
      req
    );
  } catch (error) {
    logError(error, req);
  }
};
