import mongoose from "mongoose";
import User from "../../models/user.model.js";
import Service from "../../models/service.model.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { generateJobID } from "../../constants/functions.js";
import { updateUserStats } from "../../utils/updateState.js";
import logError from "../../utils/addErrorLog.js";
import { getEnglishTitles } from "../../utils/translations.js";
import { handleSendNotificationController } from "../notification.controller.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const handleAddService = asyncHandler(async (req, res) => {
  try {
    console.log("Received request body:", req.body);

    const { _id } = req.user;

    const validateOnly =
      req.body?.validateOnly === "true" ||
      req.body?.validateOnly === true;

    const serviceData = await parseAndValidateRequest(req);

    if (validateOnly) {
      return res.status(200).json({
        success: true,
        validated: true,
        message: "Service details verified. You can submit to publish.",
      });
    }

    const employer = await User.findById(_id);
    if (!employer) {
      throw new Error("Employer not found");
    }

    const jobID = await generateJobID();

    const service = await createServiceEntry({
      ...serviceData,
      employer: _id,
      jobID,
      images: [],
      uploadStatus: "PENDING",
    });

    await updateUserStats(employer._id, "SERVICE_CREATED");
    await notifyEligibleUsers(service, _id, req);

    res.status(201).json({
      success: true,
      data: service,
      message: "Service created. Images are uploading in background.",
    });

    // const images = await processImages(req.files?.images || []);
    // ✅ Trigger async upload (do not await)
    processImagesInBackground(service._id, req.files?.images || [], req);

    // res.status(201).json({ success: true, data: service });
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

    const parsedData = await parseAndValidateRequest(req);

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

const parseAndValidateRequest = async (req) => {
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

    // ✅ Fallback to employer geoLocation
    if (
      !finalGeoLocation ||
      !finalGeoLocation.coordinates ||
      finalGeoLocation.coordinates.length !== 2
    ) {
      const employer = await User.findById(req.user._id);

      if (!employer || !employer.geoLocation?.coordinates?.length) {
        throw new Error("Geo Location not found");
      }

      finalGeoLocation = employer.geoLocation;
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

const notifyEligibleUsers = async (service, employerId, request) => {
  const eligibleUsers = await User.find({
    _id: { $ne: employerId },

    // ✅ Users must have at least 1 skill
    skills: { $exists: true, $not: { $size: 0 } },
  }).select("_id name skills");

  await Promise.all(
    eligibleUsers.map((user) =>
      handleSendNotificationController(
        user._id,
        getEnglishTitles()?.NEW_SERVICE_LIVE,
        {
          name: user?.name,
          serviceName: service?.subType,
        },
        {
          actionBy: service?.employer?._id,
          actionOn: user._id,
        },
        request,
      ),
    ),
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
    });

    let uploadedImages = [];
    let progress = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      const uploaded = await uploadOnCloudinary(image.path);

      if (!uploaded) throw new Error("Upload failed");

      uploadedImages.push(uploaded);

      // ✅ Update progress
      progress = Math.round(((i + 1) / images.length) * 100);

      await Service.findByIdAndUpdate(serviceId, {
        uploadProgress: progress,
      });
    }

    // ✅ Final update
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
