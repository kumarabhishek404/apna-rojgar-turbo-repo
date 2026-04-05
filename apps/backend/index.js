import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./app/utils/connectDB.js";
import logError from "./app/utils/addErrorLog.js";

// ✅ Load environment file dynamically
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
dotenv.config({ path: envFile });

const app = express();
/** Behind Render/nginx so req.ip / X-Forwarded-* behave for error logs and analytics */
app.set("trust proxy", 1);

// ✅ CORS Setup
const corsOptions = { origin: "*" };
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Connect to the correct DB
connectDB();

// ✅ Basic route
app.get("/", (req, res) => {
  res.send("Apna Rojgar App API is running...");
});

// ✅ Import routes
import authRoutes from "./app/routes/auth.route.js";
import userRoutes from "./app/routes/user.route.js";
import employerRoutes from "./app/routes/employer.route.js";
import workerRoutes from "./app/routes/worker.route.js";
import serviceRoutes from "./app/routes/services.route.js";
import mediatorRoutes from "./app/routes/mediator.route.js";
import notificationRoutes from "./app/routes/notification.route.js";
import adminRoutes from "./app/routes/admin.route.js";
import reviewRoutes from "./app/routes/review.route.js";
import appFeedbackRoutes from "./app/routes/appFeedback.route.js";
import homeRoutes from "./app/routes/home.route.js";
import userProblemRoute from "./app/routes/userProblem.route.js";
import attendanceRoute from "./app/routes/attendance.route.js";
import errorRoutes from "./app/routes/error.route.js";
import bookingRoutes from "./app/routes/booking.route.js";
import appVersionRoutes from "./app/routes/appVersion.route.js";
import analyticsRoutes from "./app/routes/analytics.route.js";

// ✅ Import cron jobs
import scheduleNotifiyLiveServiceOfUserSkills from "./app/cron/activeServicesNotification.js";
import scheduleNotifyUsersWithPendingRequests from "./app/cron/pendingRequestsNotification.js";
import scheduleNotifyUsersForCompletingProfile from "./app/cron/profileCompletionNotification.js";
// import { createIndexes } from "./app/utils/createIndexes.js";

// ✅ Start cron jobs
scheduleNotifiyLiveServiceOfUserSkills();
scheduleNotifyUsersWithPendingRequests();
scheduleNotifyUsersForCompletingProfile();
// ✅ Routes middleware
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/employer", employerRoutes);
app.use("/api/v1/worker", workerRoutes);
app.use("/api/v1/service", serviceRoutes);
app.use("/api/v1/mediator", mediatorRoutes);
app.use("/api/v1/notification", notificationRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/feedback", appFeedbackRoutes);
app.use("/api/v1/home", homeRoutes);
app.use("/api/v1/userProblem", userProblemRoute);
app.use("/api/v1/employer/attendance", attendanceRoute);
app.use("/api/v1/errors", errorRoutes);
app.use("/api/v1/booking", bookingRoutes);
app.use("/api/v1/appVersion", appVersionRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

// ✅ Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("⚠️ Global Error:", err);

  // Only log real errors
  if (err && err.stack && req.route) {
    logError(err, req, err.status || 500, req.originalUrl);
  }

  res.status(err?.status || 500).json({
    success: false,
    message: err?.message || "Internal Server Error",
  });
});

// createIndexes()
// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
