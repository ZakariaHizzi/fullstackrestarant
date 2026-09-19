const express = require("express");
const {
  getDishes,
  getDishById,
  addDish,
  updateDish,
  deleteDish,
} = require("../controllers/dishController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public routes.
router.get("/", getDishes);
router.get("/:id", getDishById);

// Admin-only routes:
// 1. verifyToken -> valid JWT cookie (401 otherwise).
// 2. verifyAdmin -> role 'admin' (403 otherwise).
// POST accepts either JSON ({ title, price, category, image, ... },
// `{ dishes: [...] }`, or `[...]`) or multipart form-data with
// `upload.single("image")`.
router.post("/", verifyToken, verifyAdmin, upload.single("image"), addDish);
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  updateDish,
);
router.delete("/:id", verifyToken, verifyAdmin, deleteDish);

module.exports = router;
