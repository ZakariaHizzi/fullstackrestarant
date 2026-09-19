// Simple reservations: users book, admins manage

const express = require("express");
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
const ALLOWED_STATUS = ["Pending", "Confirmed", "Cancelled"];

// POST /reservations/addReservation (login required)
router.post("/addReservation", verifyToken, async (req, res) => {
  try {
    const { date, time, guests, name, email, phone } = req.body;

    const user = req.user ? await User.findById(req.user._id) : null;
    const finalName = (name || user?.name || "").trim();
    const finalEmail = (email || user?.email || "").toLowerCase().trim();

    if (!finalName || !finalEmail || !date || !time || !guests) {
      return res.status(400).json({
        success: false,
        message: "Name, email, date, time and guests are required",
      });
    }

    const reservation = await Reservation.create({
      user: user ? user._id : null,
      name: finalName,
      email: finalEmail,
      phone: typeof phone === "string" ? phone.trim() : "",
      date,
      time,
      guests,
    });

    return res.status(201).json({ success: true, message: "Reservation created", data: reservation });
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /reservations (admin)
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const list = await Reservation.find()
      .populate("user", "name email")
      .sort({ date: 1, time: 1 });
    return res.json({ success: true, count: list.length, data: list });
  } catch {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /reservations/:id (admin)
router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (status !== undefined && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be Pending, Confirmed or Cancelled" });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.phone !== undefined) updates.phone = String(req.body.phone).trim();
    if (req.body.guests !== undefined) updates.guests = req.body.guests;
    if (req.body.date !== undefined) updates.date = req.body.date;
    if (req.body.time !== undefined) updates.time = req.body.time;

    const reservation = await Reservation.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!reservation) return res.status(404).json({ success: false, message: "Reservation not found" });
    return res.json({ success: true, message: "Reservation updated", data: reservation });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid id" });
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /reservations/:id (admin)
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) return res.status(404).json({ success: false, message: "Reservation not found" });
    return res.json({ success: true, message: "Reservation deleted", data: reservation });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid id" });
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
