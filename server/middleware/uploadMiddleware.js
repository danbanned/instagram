const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage for different types
const postStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'instagram/posts',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4'],
    transformation: [{ width: 1080, crop: 'limit' }]
  }
});

const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'instagram/avatars',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }]
  }
});

const storyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'instagram/stories',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4'],
  }
});

// Dynamic storage based on field name
const storage = (req, file, cb) => {
  if (file.fieldname === 'avatar') {
    return avatarStorage;
  } else if (file.fieldname === 'story') {
    return storyStorage;
  } else {
    return postStorage;
  }
};

// Custom storage engine wrapper to handle dynamic selection
const dynamicStorage = {
  _handleFile: (req, file, cb) => {
    const selectedStorage = storage(req, file, cb);
    selectedStorage._handleFile(req, file, cb);
  },
  _removeFile: (req, file, cb) => {
    const selectedStorage = storage(req, file, cb);
    selectedStorage._removeFile(req, file, cb);
  }
};

const fileFilter = (_, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'));
  }
};

const upload = multer({ 
  storage: dynamicStorage, 
  fileFilter, 
  limits: { fileSize: 25 * 1024 * 1024 } 
});

module.exports = upload;
