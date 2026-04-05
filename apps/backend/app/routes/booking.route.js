import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingsByMobile,
} from "../controllers/booking/booking.controller.js";

const router = express.Router();

// Get all company stats
router.post("/add", createBooking);

router.get("/all", getAllBookings);
router.get("/:mobileNumber", getBookingsByMobile);

export default router;
