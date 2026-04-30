const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                     process.env.CLOUDINARY_API_KEY && 
                     process.env.CLOUDINARY_API_SECRET;

let storage;

if (useCloudinary) {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Create storage for different types
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'instagram/posts',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4'],
      transformation: [{ width: 1080, crop: 'limit' }]
    }
  });
  console.log('Using Cloudinary for file storage');
} else {
  // Local storage fallback
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  console.log('Cloudinary credentials missing. Falling back to local disk storage.');
}

const fileFilter = (_, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'));
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter, 
  limits: { fileSize: 25 * 1024 * 1024 } 
});

module.exports = upload;
