const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileTypeFromFile } = require('file-type');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const fileFilter = async (req, file, cb) => {
  // Accept only PDF based on MIME (preliminary)
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// Middleware to verify actual file type (magic bytes) after multer processes
const verifyFileType = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const type = await fileTypeFromFile(req.file.path);
    if (!type || type.mime !== 'application/pdf') {
      // Delete invalid file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid file type. Only PDF allowed.' });
    }
    next();
  } catch (err) {
    console.error('File type verification error:', err);
    next(err);
  }
};

module.exports = { upload, verifyFileType };