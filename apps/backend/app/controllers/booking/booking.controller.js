// controllers/bookingController.js
import Booking from "../../models/booking.model.js";

/**
 * POST: Create a new booking
 */
export const createBooking = async (req, res) => {
  const {
    firstName,
    lastName,
    mobileNumber,
    address,
    geoLocation,
    bookingDetails,
  } = req.body;

  if (!firstName || !lastName || !mobileNumber || !bookingDetails) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  try {
    const booking = new Booking({
      firstName,
      lastName,
      mobileNumber,
      address,
      geoLocation,
      bookingDetails,
    });

    const savedBooking = await booking.save();

    res.status(201).json({
      message: "Booking created successfully",
      data: savedBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

/**
 * GET: Fetch all bookings
 */
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Bookings fetched successfully",
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

/**
 * GET: Fetch bookings by mobile number
 */
export const getBookingsByMobile = async (req, res) => {
  try {
    const { mobileNumber } = req.params;

    if (!mobileNumber) {
      return res.status(400).json({
        message: "Mobile number is required in the URL",
      });
    }

    const bookings = await Booking.find({ mobileNumber });

    if (!bookings.length) {
      return res.status(404).json({
        message: "No bookings found for this mobile number",
      });
    }

    res.status(200).json({
      message: "Bookings fetched successfully",
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings by mobile:", error);
    res.status(500).json({
      message: "Failed to fetch bookings by mobile",
      error: error.message,
    });
  }
};
