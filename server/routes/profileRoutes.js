const express = require('express');
const router = express.Router();
const {
  getProfile,
  getReels,
  getSavedPosts,
  getReposts,
  getTaggedPosts,
  updateProfile
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (though might need optional auth to check isFollowing)
router.get('/:userId', getProfile);
router.get('/:userId/reels', getReels);
router.get('/:userId/reposts', getReposts);
router.get('/:userId/tagged', getTaggedPosts);

// Private routes
router.get('/:userId/saved', protect, getSavedPosts);
router.put('/update', protect, updateProfile);

module.exports = router;
