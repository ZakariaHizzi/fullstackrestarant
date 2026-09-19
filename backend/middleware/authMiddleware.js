// Simple auth: JWT in HttpOnly cookie (or Authorization: Bearer <token>)

require("dotenv").config();
const jwt = require("jsonwebtoken");

function getToken(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const h = req.headers.authorization;
  if (typeof h === "string" && h.startsWith("Bearer "))
    return h.slice(7).trim();
  return null;
}

function verifyToken(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Please log in first" });
  }
  if (!process.env.JWT_SECRET) {
    return res
      .status(500)
      .json({ success: false, message: "Missing JWT_SECRET" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.id, role: decoded.role };
    next();
  } catch {
    return res
      .status(401)
      .json({
        success: false,
        message: "Session expired, please log in again",
      });
  }
}

function verifyAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Admins only" });
}

function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  // Production (Vercel frontend + HTTPS API): need Secure + None for cross-site.
  // Local dev (http://localhost): Secure must be false, SameSite Lax.
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function setTokenCookie(res, token) {
  res.cookie("token", token, COOKIE_OPTIONS);
}

module.exports = {
  verifyToken,
  verifyAdmin,
  generateToken,
  setTokenCookie,
  COOKIE_OPTIONS,
};
