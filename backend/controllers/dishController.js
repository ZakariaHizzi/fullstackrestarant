// Simple dish CRUD: public read, admin write

const Dish = require("../models/Dish");

// GET /dishes
async function getDishes(req, res, next) {
  try {
    const dishes = await Dish.find().sort({ createdAt: -1 });
    res.json({ success: true, count: dishes.length, data: dishes });
  } catch (err) {
    next(err);
  }
}

// GET /dishes/:id
async function getDishById(req, res, next) {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) return res.status(404).json({ success: false, message: "Dish not found" });
    res.json({ success: true, data: dish });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid dish id" });
    }
    next(err);
  }
}

// Read one dish from JSON or form-data (supports old field names too)
function readDishInput(body = {}, file) {
  const title = String(body.title ?? body.name ?? "").trim();
  const description = String(body.description ?? body.ingredients ?? body.desc ?? "").trim();
  const category = String(body.category ?? body.tag ?? "").trim();
  const price = body.price;
  let image = String(body.image ?? "").trim();
  if (file) image = `/uploads/${file.filename}`;
  return { title, description, category, price, image };
}

function checkDish({ title, price, category }) {
  if (!title) return "Title is required";
  if (price === undefined || price === null || price === "") return "Price is required";
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0) return "Price must be a valid number (0 or more)";
  if (!category) return "Category is required";
  return null;
}

// POST /dishes (admin)
async function addDish(req, res, next) {
  try {
    // Allow bulk: [...] or { dishes: [...] }
    const bulk = Array.isArray(req.body) ? req.body : Array.isArray(req.body?.dishes) ? req.body.dishes : null;
    if (bulk) {
      const docs = [];
      for (const item of bulk) {
        const d = readDishInput(item || {}, null);
        const err = checkDish(d);
        if (err) return res.status(400).json({ success: false, message: err });
        docs.push({ ...d, price: Number(d.price) });
      }
      const created = await Dish.insertMany(docs);
      return res.status(201).json({ success: true, message: "Dishes created", count: created.length, data: created });
    }

    const d = readDishInput(req.body || {}, req.file);
    const err = checkDish(d);
    if (err) return res.status(400).json({ success: false, message: err });

    const dish = await Dish.create({ ...d, price: Number(d.price) });
    return res.status(201).json({ success: true, message: "Dish created", data: dish });
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ success: false, message: msg });
    }
    next(err);
  }
}

// PUT /dishes/:id (admin)
async function updateDish(req, res, next) {
  try {
    const body = req.body || {};
    const updates = {};
    if (body.title !== undefined || body.name !== undefined) {
      updates.title = String(body.title ?? body.name ?? "").trim();
    }
    if (body.price !== undefined) updates.price = body.price;
    if (body.description !== undefined || body.ingredients !== undefined || body.desc !== undefined) {
      updates.description = String(body.description ?? body.ingredients ?? body.desc ?? "").trim();
    }
    if (body.category !== undefined || body.tag !== undefined) {
      updates.category = String(body.category ?? body.tag ?? "").trim();
    }
    if (body.image !== undefined) updates.image = body.image;
    if (req.file) updates.image = `/uploads/${req.file.filename}`;

    const dish = await Dish.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!dish) return res.status(404).json({ success: false, message: "Dish not found" });
    res.json({ success: true, message: "Dish updated", data: dish });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid dish id" });
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ success: false, message: msg });
    }
    next(err);
  }
}

// DELETE /dishes/:id (admin)
async function deleteDish(req, res, next) {
  try {
    const dish = await Dish.findByIdAndDelete(req.params.id);
    if (!dish) return res.status(404).json({ success: false, message: "Dish not found" });
    res.json({ success: true, message: "Dish deleted", data: dish });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid dish id" });
    next(err);
  }
}

module.exports = { getDishes, getDishById, addDish, updateDish, deleteDish };
