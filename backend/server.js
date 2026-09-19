require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const dishRoutes = require("./routes/dishRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Uploads folder: only for backward compatibility with old dishes that
// stored `/uploads/<file>`. New uploads never touch disk (multer uses
// memoryStorage) so this must never crash on read-only serverless
// filesystems (Vercel / AWS Lambda -> EROFS). Best-effort only.
const uploadsDir = path.join(__dirname, "uploads");
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.warn("Uploads dir not writable, skipping static serving:", err.message);
}

// Basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// CORS: allow frontend origin(s), cookies included
const frontendUrl = "https://fullstackrestarant.vercel.app";
app.use(
  cors({
    origin: [frontendUrl],
    credentials: true,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// Simple rate limit for login/register (100 req / 15 min per IP)
const hits = new Map();
app.use("/users", (req, res, next) => {
  if (req.method !== "POST") return next();
  const now = Date.now();
  const key = req.ip || "unknown";
  let e = hits.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (now > e.resetAt) e = { count: 0, resetAt: now + 15 * 60 * 1000 };
  e.count += 1;
  hits.set(key, e);
  if (e.count > 100) {
    return res
      .status(429)
      .json({ success: false, message: "Too many requests, try again later." });
  }
  next();
});

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Restaurant API is running",
    endpoints: {
      register: "POST /users/register",
      login: "POST /users/login",
      logout: "POST /users/logout",
      me: "GET /users/me",
      dishes: "GET /dishes",
      dishById: "GET /dishes/:id",
      addDish: "POST /dishes (admin)",
      addReservation: "POST /reservations/addReservation (login)",
      reservations: "GET /reservations (admin)",
    },
  });
});

// Main routes (+ /api prefix for compatibility with old clients)
app.use("/users", userRoutes);
app.use("/dishes", dishRoutes);
app.use("/reservations", reservationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/reservations", reservationRoutes);

// Alias: old clients used /foods and /files
app.use("/foods", dishRoutes);
app.use("/api/foods", dishRoutes);
// Legacy static images (dishes created before the memory-upload fix).
// Guarded: on read-only serverless filesystems the folder may not exist.
try {
  if (fs.existsSync(uploadsDir)) {
    app.use("/uploads", express.static(uploadsDir));
    app.use("/files", express.static(uploadsDir));
  }
} catch (err) {
  console.warn("Static uploads disabled:", err.message);
}

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ success: false, message: "Image too large (max 2MB)" });
  }
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server error",
  });
});

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;

async function start() {
  if (!mongoUri) {
    console.error("Missing MONGO_URL in .env");
    process.exit(1);
  }
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

start();
