// models/booking.model.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  geoLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  bookingDetails: {
    serviceTitle: { type: String },
    serviceDescription: { type: String },
    price: { type: Number },
    estimateTime: { type: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
