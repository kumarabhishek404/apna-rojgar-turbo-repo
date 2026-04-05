import mongoose from "mongoose";
import Service from "../models/Service";
import Invitation from "../models/Invitation";
import User from "../models/User";
import cron from "node-cron";

const statsValidator = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const byServiceStats = await Service.aggregate([
      { $match: { "selectedUsers.user": mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
          applied: { $sum: { $size: "$appliedUsers" } },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
          },
          selected: { $sum: { $size: "$selectedUsers" } },
        },
      },
    ]);

    const directBookingStats = await Service.aggregate([
      {
        $match: {
          "selectedUsers.user": mongoose.Types.ObjectId(userId),
          serviceType: "direct",
        },
      },
      {
        $group: {
          _id: null,
          bookingPending: {
            $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
          },
          bookingCancelled: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
          },
          bookingCompleted: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
        },
      },
    ]);

    const invitationStats = await Invitation.aggregate([
      { $match: { bookedWorker: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          sentRequests: { $sum: 1 }, // Total number of invitations sent
          requestRejected: {
            $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] },
          },
          requestAccepted: {
            $sum: { $cond: [{ $eq: ["$status", "ACCEPTED"] }, 1, 0] },
          },
          requestCancelled: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
          },
        },
      },
    ]);

    await User.findByIdAndUpdate(userId, {
      $set: {
        "workDetails.byService": byServiceStats[0] || {
          total: 0,
          completed: 0,
          applied: { byMySelf: 0, byMediator: 0 },
          cancelled: 0,
          selected: 0,
          cancelledApply: { byMySelf: 0, byEmployer: 0, byMediator: 0 },
          cancelledSelection: { byMySelf: 0, byEmployer: 0, byMediator: 0 },
        },
        "workDetails.directBooking": directBookingStats[0] || {
          sentRequests: 0,
          requestRejected: 0,
          requestAccepted: 0,
          requestCancelled: 0,
          bookingPending: 0,
          bookingCancelled: 0,
          bookingCompleted: 0,
        },
        "serviceDetails.byService": byServiceStats[0] || {
          total: 0,
          completed: 0,
          pending: 0,
          cancelled: 0,
        },
        "serviceDetails.directBooking": invitationStats[0] || {
          sentRequests: 0,
          requestRejected: 0,
          requestAccepted: 0,
          requestCancelled: 0,
          bookingPending: 0,
          bookingCancelled: 0,
          bookingCompleted: 0,
        },
      },
    });

    console.log(`User stats updated for ${userId}`);
  } catch (error) {
    console.error("Error updating user stats:", error);
  }
};

const runCronJob = async () => {
  try {
    console.log("Starting user stats update cron job at 3 AM...");

    const users = await User.find({}, "_id");
    for (const user of users) {
      await statsValidator(user._id);
    }

    console.log("User stats update completed.");
  } catch (error) {
    console.error("Error running cron job:", error);
  }
};

// Schedule the job to run daily at 3 AM
cron.schedule("0 3 * * *", runCronJob, {
  scheduled: true,
  timezone: "UTC", // Change to your timezone if needed
});

console.log("Cron job scheduled to update user stats daily at 3 AM.");
