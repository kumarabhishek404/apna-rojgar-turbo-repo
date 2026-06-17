import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import userStatus from "../middlewares/userStatus.middleware.js";
import {
  createServicePromotionOrder,
  getPromotionPaymentConfig,
  handleCashfreeWebhook,
  verifyServicePromotionPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/webhook/cashfree", handleCashfreeWebhook);

router.use(verifyToken, userStatus);

router.get("/promotion/config", getPromotionPaymentConfig);
router.post("/promotion/create-order", createServicePromotionOrder);
router.post("/promotion/verify", verifyServicePromotionPayment);

export default router;
