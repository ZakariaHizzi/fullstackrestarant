// Simple image upload: only images, max 2MB, kept in memory.
//
// NOTE: we intentionally use memoryStorage (not diskStorage).
// Serverless hosts (Vercel / AWS Lambda, path /var/task/...) have a
// read-only filesystem except /tmp, so writing to backend/uploads
// crashes with: EROFS: read-only file system.
// The controller converts req.file.buffer into a persistent image
// reference (Cloudinary URL when configured, data-URL otherwise).

const multer = require("multer");

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith("image/"))
    return cb(null, true);
  const err = new Error("Only image files are allowed");
  err.status = 400;
  cb(err);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = upload;
