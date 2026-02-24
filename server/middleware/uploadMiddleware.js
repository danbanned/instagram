const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const fileFilter = (_, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } });

module.exports = upload;
