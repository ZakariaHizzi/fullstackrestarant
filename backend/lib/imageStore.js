// Convert an in-memory multer file (memoryStorage) into a persistent
// image reference that can be stored in MongoDB.
//
// Strategy:
// 1. If Cloudinary is configured via env, upload the buffer there and
//    return the hosted https URL (recommended for production — keeps
//    documents small and images CDN-served).
// 2. Otherwise return a data-URL (data:<mime>;base64,...) built from the
//    buffer. This needs zero extra infrastructure and works on read-only
//    serverless filesystems (Vercel / AWS Lambda) where disk writes throw
//    EROFS. Multer already enforces the 2MB limit, so documents stay well
//    under MongoDB's 16MB limit.
//
// Cloudinary env (all optional, enables option 1):
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
//   (optional CLOUDINARY_FOLDER, defaults to "dishes")
//
// Uses native fetch/FormData/Blob (Node 18+) — no extra dependency.

const crypto = require("crypto");

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

async function uploadToCloudinary(file) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || "dishes";

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname || "image");
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  if (!json.secure_url) throw new Error("Cloudinary upload returned no URL");
  return json.secure_url;
}

function fileToDataUrl(file) {
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}

// Main entry: multer memory file -> storable string. Returns "" when no file.
async function storeImage(file) {
  if (!file || !file.buffer || !file.buffer.length) return "";
  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    const err = new Error("Only image files are allowed");
    err.status = 400;
    throw err;
  }
  if (cloudinaryConfigured()) return uploadToCloudinary(file);
  return fileToDataUrl(file);
}

module.exports = { storeImage, cloudinaryConfigured };
