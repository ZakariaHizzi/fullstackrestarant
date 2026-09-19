const mongoose = require("mongoose");

//  * Main dish document schema.
//  * - title:       Dish title (required, renamed from legacy `name`)
//  * - description: Ingredients / short description (optional, defaults to "")
//  * - price:       Price in restaurant currency (required, >= 0)
//  * - category:    e.g. RAW, SIGNATURE, HOT, SWEET, PASTA... (required)
//  * - image:       URL or `/uploads/<filename>` path (optional to support
//  *                both JSON `{ image: "https://..." }` and
//  *                multipart `upload.single("image")` flows)
//  */
const dishesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Dish title is required"],
    trim: true,
    maxlength: [120, "Title cannot exceed 120 characters"],
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
    index: true,
  },
  image: {
    type: String,
    default: "",
    trim: true,
  },
});

const Dish = mongoose.models.Dish || mongoose.model("Dish", dishesSchema);

// Default export is the model (so `require("./Dish")` works like before),
// named exports expose the schemas for reuse in Order, seeding, tests, etc.
module.exports = Dish;
