const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getUserProfile, getUserPosts, searchUsers, getMyFollowing } = require('../controllers/userController');

const router = express.Router();

// Static routes before /:userId to avoid param capture
router.get('/search',    protect, searchUsers);
router.get('/following', protect, getMyFollowing);

router.get('/:userId',       protect, getUserProfile);
router.get('/:userId/posts', protect, getUserPosts);

module.exports = router;
