import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./app/utils/connectDB.js";
import logError from "./app/utils/addErrorLog.js";
import { logRuntimeMode } from "./app/utils/runtimeMode.js";

// Same files in Cursor and on EC2 (apps/backend):
//   npm run dev  → NODE_ENV=development → .env + .env.local      → LOCAL_LABOUR_APP
//   npm start    → NODE_ENV=production  → .env + .env.production → LABOUR_APP
// Never use bare `node index.js` on EC2 — always `npm start` or ecosystem.config.cjs.
const backendDir = path.dirname(fileURLToPath(import.meta.url));
const nodeEnvFromHost = process.env.NODE_ENV;

dotenv.config({ path: path.join(backendDir, ".env") });

// Host (`npm start` / PM2) always wins over base `.env`.
if (nodeEnvFromHost) {
  process.env.NODE_ENV = nodeEnvFromHost;
}
process.env.NODE_ENV = process.env.NODE_ENV || "development";

const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
const envPath = path.join(backendDir, envFile);

if (process.env.NODE_ENV === "production" && !fs.existsSync(envPath)) {
  console.error(
    `❌ Missing ${envPath}. Production must load .env.production (OTP, Cashfree, PORT).`,
  );
  process.exit(1);
}

dotenv.config({ path: envPath, override: true });

const app = express();
/** Behind Render/nginx so req.ip / X-Forwarded-* behave for error logs and analytics */
app.set("trust proxy", 1);

// ✅ CORS Setup
const corsOptions = { origin: "*" };
app.use(cors(corsOptions));
app.use(
  express.json({
    verify: (req, _res, buf) => {
      if (req.originalUrl === "/api/v1/payments/webhook/cashfree") {
        req.rawBody = buf.toString("utf8");
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

// ✅ Connect to the correct DB
connectDB();

// ✅ Basic route
app.get("/", (req, res) => {
  res.send("Apna Rojgar Backend API is working for you...");
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
import paymentRoutes from "./app/routes/payment.route.js";

// ✅ Import cron jobs
import scheduleNotifiyLiveServiceOfUserSkills from "./app/cron/activeServicesNotification.js";
import scheduleNotifyUsersWithPendingRequests from "./app/cron/pendingRequestsNotification.js";
import scheduleNotifyUsersForCompletingProfile from "./app/cron/profileCompletionNotification.js";
import scheduleWeeklyRegistrationsExport from "./app/cron/weeklyRegistrationsExport.js";
import scheduleWeeklyServicesExport from "./app/cron/weeklyServicesExport.js";
// import { createIndexes } from "./app/utils/createIndexes.js";

// ✅ Start cron jobs
scheduleNotifiyLiveServiceOfUserSkills();
scheduleNotifyUsersWithPendingRequests();
scheduleNotifyUsersForCompletingProfile();
scheduleWeeklyRegistrationsExport();
scheduleWeeklyServicesExport();
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
app.use("/api/v1/payments", paymentRoutes);

// ✅ Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("⚠️ Global Error:", err);

  if (err) {
    logError(err, req, err.status || 500, req.originalUrl || "global-handler", {
      source: "backend",
    });
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
  logRuntimeMode(PORT);
});
