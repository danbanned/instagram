const express = require('express');
const router = express.Router();
const {
  getProfile,
  getReels,
  getSavedPosts,
  getReposts,
  getTaggedPosts,
  updateProfile,
  uploadAvatar  // ← ADD THIS
} = require('../controllers/profileController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // ← ADD THIS (your existing upload)

// Public routes
router.get('/:userId', optionalProtect, getProfile);
router.get('/:userId/reels', optionalProtect, getReels);
router.get('/:userId/reposts', optionalProtect, getReposts);
router.get('/:userId/tagged', optionalProtect, getTaggedPosts);

// Private routes
router.get('/:userId/saved', protect, getSavedPosts);
router.put('/update', protect, updateProfile);

// ========== ADD THIS NEW ROUTE ==========
// Avatar upload - uses your existing upload middleware
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
// ========================================

module.exports = router;