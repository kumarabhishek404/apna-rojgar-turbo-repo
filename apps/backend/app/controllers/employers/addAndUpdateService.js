import mongoose from "mongoose";
import User from "../../models/user.model.js";
import Service from "../../models/service.model.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { generateJobID } from "../../constants/functions.js";
import { updateUserStats } from "../../utils/updateState.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";
import { handleSendNotificationController } from "../notification.controller.js";
import Payment from "../../models/payment.model.js";
import { syncPromotionPaymentByOrderId, linkPaymentToService } from "../../utils/payment.service.js";
import { notifyMatchedUsersInBackground } from "../../utils/serviceNotificationHelpers.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const handleAddService = asyncHandler(async (req, res) => {
  try {
    console.log("Received request body:", req.body);

    const { _id } = req.user;

    const validateOnly =
      req.body?.validateOnly === "true" ||
      req.body?.validateOnly === true;

    const employer = await User.findById(_id);
    if (!employer) {
      throw new Error("Employer not found");
    }

    const serviceData = await parseAndValidateRequest(req, employer);

    const promotionMeta = await resolveSocialMediaPromotion(req, _id);

    if (validateOnly) {
      return res.status(200).json({
        success: true,
        validated: true,
        message: "Service details verified. You can submit to publish.",
      });
    }

    const jobID = await generateJobID();

    const service = await createServiceEntry({
      ...serviceData,
      ...promotionMeta,
      employer: _id,
      jobID,
      images: [],
      uploadStatus: "PENDING",
    });

    if (promotionMeta?.socialMediaPromotion?.orderId) {
      await linkPaymentToService({
        orderId: promotionMeta.socialMediaPromotion.orderId,
        userId: _id,
        serviceId: service._id,
        serviceJobId: service.jobID,
      });
    }

    await updateUserStats(employer._id, "SERVICE_CREATED");

    res.status(201).json({
      success: true,
      data: service,
      message: "Service created. Images are uploading in background.",
    });

    // Non-blocking side effects — response is already sent
    notifyMatchedUsersInBackground(service, _id, req);
    processImagesInBackground(service._id, req.files?.images || [], req);
  } catch (error) {
    await logError(error, req);
    handleErrorResponse(res, error);
  }
});

export const handleUpdateService = async (req, res) => {
  const { _id } = req.user;
  const { serviceId } = req.body;

  if (!isValidObjectId(serviceId)) {
    await logError(new Error("Invalid service ID format"), req, 400);
    return res
      .status(400)
      .json({ success: false, message: "Invalid service ID format" });
  }

  try {
    const service = await getServiceById(serviceId, _id);
    if (!service) {
      await logError(new Error("Service not found or unauthorized"), req, 400);
      return res.status(404).json({
        success: false,
        message: "Service not found or unauthorized",
      });
    }

    console.log("Received request body:", JSON.stringify(req.body, null, 2));

    if (typeof req.body === "string") {
      req.body = JSON.parse(req.body);
    }

    const parsedData = await parseAndValidateRequest(req, null);

    if (!parsedData) {
      await logError(new Error("Invalid input data"), req, 400);
      return res.status(400).json({ message: "Invalid input data" });
    }

    console.log("req.files:", req.files);

    const savedImages = req.files?.images?.length
      ? await processImages(req.files.images)
      : service.images;

    const updatedService = await updateService(
      serviceId,
      parsedData,
      savedImages,
    );

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (error) {
    await logError(error, req);
    handleErrorResponse(res, error);
  }
};

const parseAndValidateRequest = async (req, employerDoc = null) => {
  try {
    const {
      type,
      subType,
      description = "",
      geoLocation,
      startDate,
      address,
      requirements = "[]",
      facilities = "{}",
      duration,
      bookingType = "byService",
    } = req.body;

    if (
      !type ||
      !subType ||
      !address ||
      !startDate ||
      !duration ||
      !bookingType
    ) {
      throw new Error("Missing required fields");
    }

    // ✅ Parse geoLocation
    let finalGeoLocation =
      typeof geoLocation === "string"
        ? safeParseJSON(geoLocation)
        : geoLocation;

    // ✅ Fallback to employer geoLocation when request doesn't include valid coordinates
    if (
      !finalGeoLocation ||
      !Array.isArray(finalGeoLocation.coordinates) ||
      finalGeoLocation.coordinates.length !== 2
    ) {
      const employer =
        employerDoc || (await User.findById(req.user._id));

      if (
        employer &&
        Array.isArray(employer.geoLocation?.coordinates) &&
        employer.geoLocation.coordinates.length === 2
      ) {
        finalGeoLocation = employer.geoLocation;
      }
    }

    // ✅ Keep service posting non-blocking even when geocoding/profile location is unavailable.
    if (
      !finalGeoLocation ||
      !Array.isArray(finalGeoLocation.coordinates) ||
      finalGeoLocation.coordinates.length !== 2
    ) {
      finalGeoLocation = {
        type: "Point",
        coordinates: [0, 0],
      };
    }

    const result = {
      type,
      subType,
      description,
      startDate: new Date(startDate),
      address,
      requirements: parseRequirements(requirements),
      facilities: parseFacilities(facilities),
      duration: Number(duration),
      bookingType: String(bookingType),

      // ✅ ONLY geoLocation
      geoLocation: {
        type: "Point",
        coordinates: finalGeoLocation.coordinates, // [lng, lat]
      },
    };

    return result;
  } catch (error) {
    await logError(error, req);
    throw error;
  }
};

const parseRequirements = (requirements) => {
  try {
    return Array.isArray(requirements)
      ? requirements
      : JSON.parse(requirements);
  } catch (error) {
    console.error("Error parsing requirements:", error);
    throw new Error("Invalid requirements format");
  }
};

const parseFacilities = (facilities) => {
  try {
    return typeof facilities === "string" ? JSON.parse(facilities) : facilities;
  } catch (error) {
    console.error("Error parsing facilities:", error);
    throw new Error("Invalid facilities format");
  }
};

const parseBooleanField = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

const resolveSocialMediaPromotion = async (req, employerId) => {
  const wantsPromotion = parseBooleanField(req.body?.promoteSocialMedia);
  const promotionOrderId = String(req.body?.promotionOrderId || "").trim();

  if (!wantsPromotion) {
    return {
      socialMediaPromotion: {
        enabled: false,
        orderId: "",
        amount: 0,
        status: "NONE",
      },
    };
  }

  if (!promotionOrderId) {
    throw new Error("Promotion payment order ID is required");
  }

  const payment = await Payment.findOne({
    orderId: promotionOrderId,
    user: employerId,
    purpose: "SERVICE_SOCIAL_PROMOTION",
  });

  if (!payment) {
    throw new Error("Promotion payment order not found");
  }

  if (payment.service) {
    throw new Error("This promotion payment is already linked to another service");
  }

  if (payment.status !== "PAID") {
    const syncedPayment = await syncPromotionPaymentByOrderId(promotionOrderId);
    if (!syncedPayment || syncedPayment.status !== "PAID") {
      throw new Error("Promotion payment is not completed");
    }
    payment.status = syncedPayment.status;
    payment.paidAt = syncedPayment.paidAt;
    payment.amount = syncedPayment.amount;
  }

  return {
    socialMediaPromotion: {
      enabled: true,
      orderId: payment.orderId,
      amount: payment.amount,
      status: "PAID",
      paidAt: payment.paidAt || new Date(),
    },
    promotionOrderId: payment.orderId,
  };
};

const processImages = async (images) => {
  if (!images || images.length === 0) {
    return [];
  }

  return await Promise.all(
    images.map(async (image) => {
      if (typeof image === "string") {
        return image;
      } else if (image?.path) {
        const uploadedImage = await uploadOnCloudinary(image.path);

        if (!uploadedImage) {
          throw new Error("Failed to upload image to cloudinary");
        }

        return uploadedImage;
      } else {
        throw new Error("Invalid image format");
      }
    }),
  );
};

const createServiceEntry = async (serviceData) => Service.create(serviceData);

const updateService = async (serviceId, parsedData, savedImages) => {
  return await Service.findByIdAndUpdate(
    serviceId,
    { ...parsedData, images: savedImages },
    { new: true }, // Ensures updated document is returned
  );
};


const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const getServiceById = async (serviceId, employerId) =>
  Service.findOne({ _id: serviceId, employer: employerId });

const handleErrorResponse = (res, error) =>
  res.status(500).json({
    success: false,
    message: error?.message || "Something went wrong",
  });

const safeParseJSON = (data) => {
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error("Invalid JSON format:", data, err);
    throw new Error("Invalid JSON format in request");
  }
};

const processImagesInBackground = async (serviceId, images, req) => {
  try {
    if (!images || images.length === 0) {
      await Service.findByIdAndUpdate(serviceId, {
        uploadStatus: "COMPLETED",
        uploadProgress: 100,
      });
      return;
    }

    await Service.findByIdAndUpdate(serviceId, {
      uploadStatus: "PROCESSING",
      uploadProgress: 0,
    });

    const total = images.length;
    const uploadedImages = new Array(total);

    const concurrency = 2;
    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      const results = await Promise.all(
        batch.map(async (image, batchIndex) => {
          const uploaded = await uploadOnCloudinary(image.path);
          if (!uploaded) throw new Error("Upload failed");
          uploadedImages[i + batchIndex] = uploaded;
          return uploaded;
        }),
      );

      const progress = Math.round(
        (uploadedImages.filter(Boolean).length / total) * 100,
      );
      await Service.findByIdAndUpdate(serviceId, { uploadProgress: progress });
    }

    await Service.findByIdAndUpdate(serviceId, {
      images: uploadedImages,
      uploadStatus: "COMPLETED",
      uploadProgress: 100,
    });
  } catch (error) {
    console.error("Background upload failed:", error);

    await Service.findByIdAndUpdate(serviceId, {
      uploadStatus: "FAILED",
    });

    await logError(error, req);
  }
};

/** Append images to an existing service (used by mobile two-phase upload). */
export const handleUploadServiceImages = asyncHandler(async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { _id } = req.user;

    if (!isValidObjectId(serviceId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid service ID" });
    }

    const service = await Service.findOne({
      _id: serviceId,
      employer: _id,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or unauthorized",
      });
    }

    const incoming = req.files?.images || [];
    const existingCount = Array.isArray(service.images)
      ? service.images.length
      : 0;

    if (existingCount + incoming.length > 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum 3 images allowed per service",
      });
    }

    if (incoming.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images provided",
      });
    }

    res.status(202).json({
      success: true,
      message: "Images are uploading in background.",
      serviceId,
      accepted: incoming.length,
    });

    processImagesAppendInBackground(serviceId, incoming, existingCount, req);
  } catch (error) {
    await logError(error, req);
    handleErrorResponse(res, error);
  }
});

const processImagesAppendInBackground = async (
  serviceId,
  images,
  existingCount,
  req,
) => {
  try {
    await Service.findByIdAndUpdate(serviceId, {
      uploadStatus: "PROCESSING",
    });

    const total = existingCount + images.length;
    const newUrls = [];

    for (let i = 0; i < images.length; i++) {
      const uploaded = await uploadOnCloudinary(images[i].path);
      if (!uploaded) throw new Error("Upload failed");
      newUrls.push(uploaded);

      const progress = Math.round(((existingCount + i + 1) / total) * 100);
      await Service.findByIdAndUpdate(serviceId, { uploadProgress: progress });
    }

    await Service.findByIdAndUpdate(
      serviceId,
      {
        $push: { images: { $each: newUrls } },
        uploadStatus: "COMPLETED",
        uploadProgress: 100,
      },
      { new: true },
    );
  } catch (error) {
    console.error("Append upload failed:", error);
    await Service.findByIdAndUpdate(serviceId, { uploadStatus: "FAILED" });
    await logError(error, req);
  }
};

export const checkStatusOfImageUploading = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).select(
      "uploadStatus uploadProgress images",
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.json({
      success: true,
      status: service.uploadStatus,
      progress: service.uploadProgress,
      images: service.images,
    });
  } catch (error) {
    console.error("Failed to check status:", error);
    res.status(500).json({ success: false });
  }
};
