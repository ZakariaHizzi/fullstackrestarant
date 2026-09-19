const mongoose = require("mongoose");

/**
 * Reservation Schema
 * - user:     Reference to the User who made the booking (null for guests)
 * - name:     Name used for the reservation (required)
 * - email:    Contact email for the reservation (required)
 * - phone:    Contact phone for the reservation (optional, admin dashboard)
 * - date:     Date of the reservation (required)
 * - time:     Time slot of the reservation, e.g. "19:30" (required)
 * - guests:   Number of guests attending (required)
 * - status:   Booking status — Pending | Confirmed | Cancelled (admin managed)
 */
const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
      trim: true,
    },
    guests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "At least 1 guest is required"],
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Reservation", reservationSchema);