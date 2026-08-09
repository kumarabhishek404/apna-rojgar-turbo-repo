import User from "../models/user.model.js";
import Request from "../models/request.model.js";
import ErrorLog from "../models/errors.model.js";
import AppEvent from "../models/appEvent.model.js";
import Notification from "../models/notification.model.js";
import Payment from "../models/payment.model.js";
import Service from "../models/service.model.js";
import Invitation from "../models/invitation.model.js";
import { getPromotionPaymentStats } from "../utils/payment.service.js";
import { handleSendNotificationController } from "./notification.controller.js";
import { exportWeeklyRegistrations } from "../cron/weeklyRegistrationsExport.js";
import { exportWeeklyServices } from "../cron/weeklyServicesExport.js";
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

/**
 * GET /admin/direct-requests
 * Employer → worker/mediator direct booking invitations (Invitation model).
 */
export const getAdminDirectRequests = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const status = String(req.query.status || "ALL").trim().toUpperCase();
  const receiverRole = String(req.query.role || "ALL").trim().toUpperCase();
  const search = String(req.query.search || "").trim();

  const query = {};
  if (status && status !== "ALL") query.status = status;

  try {
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const ids = matchingUsers.map((u) => u._id);
      query.$or = [
        { employer: { $in: ids } },
        { bookedWorker: { $in: ids } },
        { address: { $regex: search, $options: "i" } },
        { "appliedSkill.skill": { $regex: search, $options: "i" } },
      ];
    }

    if (receiverRole && receiverRole !== "ALL") {
      const receivers = await User.find({ role: receiverRole }).select("_id");
      query.bookedWorker = { $in: receivers.map((u) => u._id) };
    }

    const [total, invitations, statusStats] = await Promise.all([
      Invitation.countDocuments(query),
      Invitation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(
          "employer",
          "name mobile role address profilePicture email status registrationSource",
        )
        .populate(
          "bookedWorker",
          "name mobile role address profilePicture email status registrationSource skills",
        ),
      Invitation.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      total,
      pending: 0,
      accepted: 0,
      rejected: 0,
      cancelled: 0,
      removed: 0,
      left: 0,
    };
    statusStats.forEach((entry) => {
      const key = String(entry?._id || "").toLowerCase();
      if (Object.prototype.hasOwnProperty.call(stats, key)) {
        stats[key] = entry.count;
      }
    });

    res.status(200).json({
      success: true,
      message: "Direct booking requests fetched successfully",
      data: invitations,
      stats,
      pagination: {
        page,
        pages: Math.ceil(total / limit) || 1,
        total,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch direct requests",
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

const SESSION_EVENTS = ["session_start", "app_foreground", "app_background"];
const VIEW_EVENTS = ["service_view", "profile_view"];
const CALL_EVENTS = ["call_tap"];
const CONVERSION_EVENTS = [
  "service_apply_success",
  "service_unapply_success",
  "worker_booking_request_success",
];

function isAllTimeRange(query) {
  const range = String(query?.range || "").trim().toLowerCase();
  const allFlag = String(query?.all || "").trim().toLowerCase();
  const from = String(query?.from || "").trim().toLowerCase();
  return range === "all" || allFlag === "true" || allFlag === "1" || from === "all";
}

async function parseAnalyticsRange(query) {
  const now = new Date();
  const toRaw = query?.to ? new Date(String(query.to)) : now;
  let to = Number.isNaN(toRaw.getTime()) ? now : toRaw;

  if (isAllTimeRange(query)) {
    const earliest = await AppEvent.findOne({})
      .sort({ serverTimestamp: 1 })
      .select("serverTimestamp")
      .lean();
    const from = earliest?.serverTimestamp
      ? new Date(earliest.serverTimestamp)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from, to, all: true };
  }

  let from;
  if (query?.from) {
    const fromRaw = new Date(String(query.from));
    from = Number.isNaN(fromRaw.getTime())
      ? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
      : fromRaw;
  } else {
    from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }

  return { from, to, all: false };
}

function categoryForEventName(eventName) {
  const name = String(eventName || "");
  if (SESSION_EVENTS.includes(name)) return "sessions";
  if (VIEW_EVENTS.includes(name)) return "views";
  if (CALL_EVENTS.includes(name)) return "calls";
  if (CONVERSION_EVENTS.includes(name)) return "conversions";
  if (name.startsWith("web_")) return "web";
  return "other";
}

function emptyDailyMap(from, to) {
  const map = new Map();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const cursor = new Date(from.getTime());
  const endMs = to.getTime();
  // 12h steps so IST calendar days are not skipped near UTC midnight.
  while (cursor.getTime() <= endMs) {
    const key = fmt.format(cursor);
    if (!map.has(key)) map.set(key, { date: key });
    cursor.setUTCHours(cursor.getUTCHours() + 12);
  }
  const endKey = fmt.format(to);
  if (!map.has(endKey)) map.set(endKey, { date: endKey });
  return map;
}

function fillDailySeries(map, eventKeys) {
  return Array.from(map.values())
    .map((row) => {
      const out = { date: row.date };
      for (const key of eventKeys) {
        out[key] = Number(row[key] || 0);
      }
      return out;
    })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

/**
 * Chart-ready aggregations over app_events for the admin analytics dashboard.
 * GET /admin/analytics-summary?from=&to=&platform=
 */
export const getAdminAnalyticsSummary = async (req, res) => {
  try {
    const { from, to, all } = await parseAnalyticsRange(req.query);
    const platform = String(req.query.platform || "")
      .trim()
      .toLowerCase();

    const match = {
      serverTimestamp: { $gte: from, $lte: to },
    };
    if (["android", "ios", "web"].includes(platform)) {
      match.platform = platform;
    }

    const [
      eventCounts,
      uniqueStats,
      dailyByEvent,
      byPlatform,
      hourWeekdayRows,
    ] = await Promise.all([
      AppEvent.aggregate([
        { $match: match },
        { $group: { _id: "$eventName", count: { $sum: 1 } } },
      ]),
      AppEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            uniqueUsers: { $addToSet: "$userId" },
            uniqueSessions: { $addToSet: "$sessionId" },
            totalEvents: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            totalEvents: 1,
            uniqueUsers: {
              $size: {
                $filter: {
                  input: "$uniqueUsers",
                  as: "u",
                  cond: { $ne: ["$$u", null] },
                },
              },
            },
            uniqueSessions: {
              $size: {
                $filter: {
                  input: "$uniqueSessions",
                  as: "s",
                  cond: {
                    $and: [{ $ne: ["$$s", null] }, { $ne: ["$$s", ""] }],
                  },
                },
              },
            },
          },
        },
      ]),
      AppEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$serverTimestamp",
                  timezone: "Asia/Kolkata",
                },
              },
              eventName: "$eventName",
            },
            count: { $sum: 1 },
          },
        },
      ]),
      AppEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$platform",
            count: { $sum: 1 },
          },
        },
      ]),
      AppEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              weekday: {
                $dayOfWeek: {
                  date: "$serverTimestamp",
                  timezone: "Asia/Kolkata",
                },
              },
              hour: {
                $hour: {
                  date: "$serverTimestamp",
                  timezone: "Asia/Kolkata",
                },
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const countByEvent = {};
    for (const row of eventCounts) {
      const name = String(row?._id || "");
      if (!name) continue;
      countByEvent[name] = Number(row.count || 0);
    }

    const uniques = uniqueStats[0] || {
      totalEvents: 0,
      uniqueUsers: 0,
      uniqueSessions: 0,
    };

    const kpis = {
      totalEvents: Number(uniques.totalEvents || 0),
      uniqueUsers: Number(uniques.uniqueUsers || 0),
      uniqueSessions: Number(uniques.uniqueSessions || 0),
      sessionStarts: countByEvent.session_start || 0,
      appForeground: countByEvent.app_foreground || 0,
      appBackground: countByEvent.app_background || 0,
      serviceViews: countByEvent.service_view || 0,
      profileViews: countByEvent.profile_view || 0,
      callTaps: countByEvent.call_tap || 0,
      serviceApplies: countByEvent.service_apply_success || 0,
      serviceUnapplies: countByEvent.service_unapply_success || 0,
      bookingRequests: countByEvent.worker_booking_request_success || 0,
    };

    const sessionsMap = emptyDailyMap(from, to);
    const viewsMap = emptyDailyMap(from, to);
    const callsMap = emptyDailyMap(from, to);
    const conversionsMap = emptyDailyMap(from, to);

    for (const row of dailyByEvent) {
      const date = row?._id?.date;
      const eventName = String(row?._id?.eventName || "");
      const count = Number(row?.count || 0);
      if (!date || !eventName) continue;

      if (SESSION_EVENTS.includes(eventName)) {
        if (!sessionsMap.has(date)) sessionsMap.set(date, { date });
        sessionsMap.get(date)[eventName] = count;
      }
      if (VIEW_EVENTS.includes(eventName)) {
        if (!viewsMap.has(date)) viewsMap.set(date, { date });
        viewsMap.get(date)[eventName] = count;
      }
      if (CALL_EVENTS.includes(eventName)) {
        if (!callsMap.has(date)) callsMap.set(date, { date });
        callsMap.get(date)[eventName] = count;
      }
      if (CONVERSION_EVENTS.includes(eventName)) {
        if (!conversionsMap.has(date)) conversionsMap.set(date, { date });
        conversionsMap.get(date)[eventName] = count;
      }
    }

    const categoryTotals = {
      sessions: 0,
      views: 0,
      calls: 0,
      conversions: 0,
      web: 0,
      other: 0,
    };
    for (const [eventName, count] of Object.entries(countByEvent)) {
      const cat = categoryForEventName(eventName);
      categoryTotals[cat] = (categoryTotals[cat] || 0) + count;
    }

    const byCategory = Object.entries(categoryTotals)
      .filter(([, count]) => count > 0)
      .map(([category, count]) => ({ category, count }));

    const platformTotals = { web: 0, android: 0, ios: 0, unknown: 0 };
    for (const row of byPlatform) {
      const p = String(row?._id || "").toLowerCase();
      const count = Number(row?.count || 0);
      if (p === "web") platformTotals.web = count;
      else if (p === "android") platformTotals.android = count;
      else if (p === "ios") platformTotals.ios = count;
      else platformTotals.unknown += count;
    }

    // Mongo $dayOfWeek: 1=Sunday … 7=Saturday. Heatmap uses Mon–Sun labels on client.
    const byHourWeekday = byHourWeekdayRawToSeries(hourWeekdayRows);

    return res.status(200).json({
      success: true,
      message: "Admin analytics summary fetched successfully",
      data: {
        range: {
          from: from.toISOString(),
          to: to.toISOString(),
          all: Boolean(all),
        },
        kpis,
        dailySessions: fillDailySeries(sessionsMap, SESSION_EVENTS),
        dailyViews: fillDailySeries(viewsMap, VIEW_EVENTS),
        dailyCalls: fillDailySeries(callsMap, CALL_EVENTS),
        dailyConversions: fillDailySeries(conversionsMap, CONVERSION_EVENTS),
        byCategory,
        byPlatform: Object.entries(platformTotals)
          .filter(([, count]) => count > 0)
          .map(([platformName, count]) => ({
            platform: platformName,
            count,
          })),
        byHourWeekday,
        byEvent: Object.entries(countByEvent)
          .map(([eventName, count]) => ({ eventName, count }))
          .sort((a, b) => b.count - a.count),
      },
    });
  } catch (error) {
    logError(error, req, 500);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch analytics summary",
    });
  }
};

/** Build Apex heatmap series: one series per weekday (Mon–Sun), data = [hour, count]×24 */
function byHourWeekdayRawToSeries(rows) {
  const weekdayOrder = [
    { mongo: 2, label: "Mon" },
    { mongo: 3, label: "Tue" },
    { mongo: 4, label: "Wed" },
    { mongo: 5, label: "Thu" },
    { mongo: 6, label: "Fri" },
    { mongo: 7, label: "Sat" },
    { mongo: 1, label: "Sun" },
  ];

  const grid = new Map();
  for (const w of weekdayOrder) {
    grid.set(w.mongo, Array.from({ length: 24 }, () => 0));
  }

  for (const row of rows || []) {
    const weekday = Number(row?._id?.weekday);
    const hour = Number(row?._id?.hour);
    const count = Number(row?.count || 0);
    if (!grid.has(weekday) || hour < 0 || hour > 23) continue;
    grid.get(weekday)[hour] = count;
  }

  return weekdayOrder.map((w) => ({
    name: w.label,
    data: grid.get(w.mongo).map((count, hour) => ({ x: String(hour), y: count })),
  }));
}

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

/**
 * GET /admin/all-services
 * Paginated list of every registered Service with employer details populated.
 */
export const getAdminAllServices = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const status = String(req.query.status || "ALL").trim().toUpperCase();
  const bookingType = String(req.query.bookingType || "ALL").trim();
  const search = String(req.query.search || "").trim();

  const query = {};
  if (status && status !== "ALL") query.status = status;
  if (bookingType && bookingType !== "ALL") query.bookingType = bookingType;

  try {
    if (search) {
      const matchingEmployers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      query.$or = [
        { jobID: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
        { subType: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { employer: { $in: matchingEmployers.map((user) => user._id) } },
      ];
    }

    const [total, services, statusStats, promotionCount] = await Promise.all([
      Service.countDocuments(query),
      Service.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(
          "employer",
          "name mobile role address profilePicture status registrationSource email",
        )
        .populate(
          "bookedWorker",
          "name mobile role address profilePicture",
        )
        .populate({
          path: "appliedUsers.user",
          select: "name mobile role address profilePicture",
        })
        .populate({
          path: "appliedUsers.workers.worker",
          select: "name mobile role address profilePicture",
        }),
      Service.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Service.countDocuments({
        ...query,
        "socialMediaPromotion.enabled": true,
      }),
    ]);

    const stats = {
      total,
      hiring: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      rejected: 0,
      promoted: promotionCount,
    };
    statusStats.forEach((entry) => {
      const key = String(entry?._id || "").toUpperCase();
      if (key === "HIRING") stats.hiring = entry.count;
      else if (key === "COMPLETED") stats.completed = entry.count;
      else if (key === "CANCELLED") stats.cancelled = entry.count;
      else if (key === "PENDING") stats.pending = entry.count;
      else if (key === "REJECTED") stats.rejected = entry.count;
    });

    res.status(200).json({
      success: true,
      message: "All services fetched successfully",
      data: services,
      stats,
      pagination: {
        page,
        pages: Math.ceil(total / limit) || 1,
        total,
        limit,
      },
    });
  } catch (error) {
    logError(error, req, 500);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch services",
    });
  }
};

export const getAdminPromotionPayments = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const skip = (page - 1) * limit;
  const status = String(req.query.status || "ALL").trim().toUpperCase();
  const search = String(req.query.search || "").trim();

  const query = { purpose: "SERVICE_SOCIAL_PROMOTION" };
  if (status && status !== "ALL") {
    query.status = status;
  }

  try {
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { user: { $in: matchingUsers.map((user) => user._id) } },
      ];
    }

    const [total, payments, stats] = await Promise.all([
      Payment.countDocuments(query),
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name mobile role profilePicture address")
        .populate(
          "service",
          "jobID type subType address status socialMediaPromotion startDate createdAt",
        )
        .select(
          "user service serviceJobId orderId paymentSessionId amount currency status purpose paidAt cashfreeOrderStatus cfPaymentId paymentMethod paymentMethodDetail webhookEventId metadata createdAt updatedAt",
        ),
      getPromotionPaymentStats(),
    ]);

    res.status(200).json({
      success: true,
      message: "Promotion payments fetched successfully",
      data: payments,
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
      message: error?.message || "Failed to fetch promotion payments",
    });
  }
};

export const handleExportRegistrations = async (req, res) => {
  try {
    const result = await exportWeeklyRegistrations();

    if (result.skipped) {
      return res.status(400).json({
        success: false,
        message: result.reason || "Weekly registrations export is disabled",
      });
    }

    res.status(200).json({
      success: true,
      message:
        result.rowsExported > 0
          ? `Exported ${result.rowsExported} registration(s) to Google Sheets`
          : "No new registrations to export",
      data: {
        spreadsheetId: result.spreadsheetId,
        rowsExported: result.rowsExported,
        spreadsheetUrl: result.spreadsheetUrl,
      },
    });
  } catch (error) {
    logError(error, req, 500, "admin - exportRegistrations");
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to export registrations to Google Sheets",
    });
  }
};

export const handleExportServices = async (req, res) => {
  try {
    const result = await exportWeeklyServices();

    if (result.skipped) {
      return res.status(400).json({
        success: false,
        message: result.reason || "Weekly services export is disabled",
      });
    }

    res.status(200).json({
      success: true,
      message:
        result.rowsExported > 0
          ? `Exported ${result.rowsExported} service(s) to Google Sheets`
          : "No new services to export",
      data: {
        spreadsheetId: result.spreadsheetId,
        rowsExported: result.rowsExported,
        spreadsheetUrl: result.spreadsheetUrl,
      },
    });
  } catch (error) {
    logError(error, req, 500, "admin - exportServices");
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to export services to Google Sheets",
    });
  }
};
