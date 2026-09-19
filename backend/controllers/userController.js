// Simple user auth: register / login / logout / me

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateToken, setTokenCookie, COOKIE_OPTIONS } = require("../middleware/authMiddleware");

function publicUser(user) {
  return { _id: user._id, name: user.name, email: user.email, role: user.role };
}

// POST /users/register
async function registerUser(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: "user" });

    setTokenCookie(res, generateToken(user));
    return res.status(201).json({ success: true, message: "Registered successfully", data: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ success: false, message: msg });
    }
    return res.status(500).json({ success: false, message: "Server error during registration" });
  }
}

// POST /users/login
async function loginUser(req, res) {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    setTokenCookie(res, generateToken(user));
    return res.json({ success: true, message: "Logged in successfully", data: publicUser(user) });
  } catch {
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
}

// GET /users/me
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id).select("_id name email role");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    setTokenCookie(res, generateToken(user)); // refresh cookie
    return res.json({ success: true, data: publicUser(user) });
  } catch {
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// POST /users/logout
async function logoutUser(req, res) {
  const { maxAge, ...clearOptions } = COOKIE_OPTIONS;
  res.clearCookie("token", clearOptions);
  return res.json({ success: true, message: "Logged out successfully" });
}

module.exports = { registerUser, loginUser, logoutUser, getMe };
