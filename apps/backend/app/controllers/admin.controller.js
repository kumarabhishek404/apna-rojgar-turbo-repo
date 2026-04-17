import User from "../models/user.model.js";
import Request from "../models/request.model.js";
import ErrorLog from "../models/errors.model.js";
import AppEvent from "../models/appEvent.model.js";
import Notification from "../models/notification.model.js";
import { handleSendNotificationController } from "./notification.controller.js";
import logError from "../utils/addErrorLog.js";
import { getEnglishTitles } from "../utils/translations.js";

export const handleActivateUser = async (req, res) => {
  const admin = req?.user;
  const { userId } = req.body;

  if (!userId) {
    return res.status(404).json({
      success: false,
      message: "UserId not found",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "User is already active",
      });
    }

    user.status = "ACTIVE";
    await user.save();

    handleSendNotificationController(
      user._id,
      getEnglishTitles()?.PROFILE_ACTIVE,
      {
        workerName: user.name,
      },
      {
        actionBy: null, // Store only the ObjectId reference
        actionOn: user._id, // Store only the ObjectId reference
      },
      req,
    );

    res.status(200).json({
      success: true,
      message: "Account is activated now",
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while activating user",
    });
  }
};

export const handleSuspendUser = async (req, res) => {
  const { userId } = req.params;
  const admin = req?.user;

  if (!userId) {
    return res.status(404).json({
      success: false,
      message: "UserId not found",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "SUSPENDED") {
      return res.status(400).json({
        success: false,
        message: "User is already SUSPENDED",
      });
    }

    user.status = "SUSPENDED";
    await user.save();

    handleSendNotificationController(
      user._id,
      getEnglishTitles()?.PROFILE_SUSPEND,
      {},
      {
        actionBy: null,
        actionOn: user._id,
      },
      req,
    );

    res.status(200).json({
      success: true,
      message: "Account is now suspended",
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while suspending user",
    });
  }
};

export const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const status = String(req.query.status || "ACTIVE").trim().toUpperCase();
  const role = String(req.query.role || "").trim().toUpperCase();
  const source = String(req.query.source || "").trim().toLowerCase();
  const search = String(req.query.search || "").trim();

  const query = {};
  if (status && status !== "ALL") query.status = status;
  if (role && role !== "ALL") {
    if (role === "-") query.role = { $in: [null, ""] };
    else query.role = role;
  }
  if (source && source !== "ALL") {
    if (source === "-") query.registrationSource = { $in: [null, ""] };
    else query.registrationSource = source;
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { "email.value": { $regex: search, $options: "i" } },
    ];
  }

  try {
    const [totalUsers, users, roleStats] = await Promise.all([
      User.countDocuments(query),
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      total: totalUsers,
      admin: 0,
      workers: 0,
      mediators: 0,
      employers: 0,
      unassigned: 0,
    };
    roleStats.forEach((entry) => {
      const roleKey = String(entry?._id || "").toUpperCase();
      if (roleKey === "ADMIN") stats.admin = entry.count;
      else if (roleKey === "WORKER") stats.workers = entry.count;
      else if (roleKey === "MEDIATOR") stats.mediators = entry.count;
      else if (roleKey === "EMPLOYER") stats.employers = entry.count;
      else stats.unassigned += entry.count;
    });

    res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      data: users,
      stats,
      pagination: {
        page,
        pages: Math.ceil(totalUsers / limit),
        total: totalUsers,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const getAllRequests = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status;

  try {
    const totalRequests = await Request.countDocuments({ status });
    const requests = await Request.find({ status })
      .populate(
        "sender",
        "name email mobile address skill profilePicture rating",
      )
      .populate(
        "receiver",
        "name email mobile address skill profilePicture rating",
      )
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "All requests fetched successfully",
      data: requests,
      pagination: {
        page,
        pages: Math.ceil(totalRequests / limit),
        total: totalRequests,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

export const getAdminErrorLogs = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const search = String(req.query.search || "").trim();
  const method = String(req.query.method || "").trim().toUpperCase();
  const statusCode = String(req.query.statusCode || "").trim();

  const query = {};
  if (search) {
    query.$or = [
      { message: { $regex: search, $options: "i" } },
      { apiRoute: { $regex: search, $options: "i" } },
      { method: { $regex: search, $options: "i" } },
    ];
  }
  if (method && method !== "ALL") query.method = method;
  if (statusCode && statusCode !== "ALL" && !Number.isNaN(Number(statusCode))) {
    query.statusCode = Number(statusCode);
  }

  try {
    const [total, logs] = await Promise.all([
      ErrorLog.countDocuments(query),
      ErrorLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "message apiRoute method statusCode createdAt user tokenSubjectUserId device clientHeaders",
        ),
    ]);

    res.status(200).json({
      success: true,
      message: "Admin error logs fetched successfully",
      data: logs,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch admin error logs",
    });
  }
};

export const getAdminAnalyticsEvents = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const eventName = String(req.query.eventName || "").trim();
  const platform = String(req.query.platform || "").trim().toLowerCase();
  const search = String(req.query.search || "").trim();

  const query = {};
  if (eventName) query.eventName = eventName;
  if (["android", "ios", "web"].includes(platform)) query.platform = platform;
  if (search) {
    query.$or = [
      { eventName: { $regex: search, $options: "i" } },
      { sessionId: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const [total, events, platformStats] = await Promise.all([
      AppEvent.countDocuments(query),
      AppEvent.find(query)
        .sort({ serverTimestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name mobile role status")
        .select(
          "eventName platform sessionId properties clientTimestamp serverTimestamp locale timezone appVersion osVersion deviceModel deviceManufacturer userId",
        ),
      AppEvent.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$platform",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = { total, web: 0, android: 0, ios: 0, unknown: 0 };
    platformStats.forEach((entry) => {
      const p = String(entry?._id || "").toLowerCase();
      if (p === "web") stats.web = entry.count;
      else if (p === "android") stats.android = entry.count;
      else if (p === "ios") stats.ios = entry.count;
      else stats.unknown += entry.count;
    });

    res.status(200).json({
      success: true,
      message: "Admin analytics events fetched successfully",
      data: events,
      stats,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch analytics events",
    });
  }
};

export const getAdminNotifications = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const status = String(req.query.status || "").trim().toUpperCase();
  const read = String(req.query.read || "").trim().toLowerCase();
  const category = String(req.query.category || "").trim().toUpperCase();
  const search = String(req.query.search || "").trim();

  const query = {};
  if (["PENDING", "SENT", "FAILED"].includes(status)) {
    query.status = status;
  }
  if (["true", "false"].includes(read)) {
    query.read = read === "true";
  }
  if (category && category !== "ALL") query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { body: { $regex: search, $options: "i" } },
      { type: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const [total, notifications, notificationStats] = await Promise.all([
      Notification.countDocuments(query),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name mobile role status profilePicture")
        .populate("data.actionBy", "name mobile role profilePicture")
        .populate("data.actionOn", "name mobile role profilePicture")
        .select("userId category type title body status read data createdAt updatedAt"),
      Notification.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            sent: {
              $sum: { $cond: [{ $eq: ["$status", "SENT"] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] },
            },
            unread: {
              $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const stats = {
      total,
      sent: notificationStats?.[0]?.sent || 0,
      pending: notificationStats?.[0]?.pending || 0,
      failed: notificationStats?.[0]?.failed || 0,
      unread: notificationStats?.[0]?.unread || 0,
    };

    res.status(200).json({
      success: true,
      message: "Admin notifications fetched successfully",
      data: notifications,
      stats,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch notifications",
    });
  }
};
