const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getHashtag, getHashtagPosts } = require('../controllers/hashtagController');

const router = express.Router();

router.get('/:name/posts', protect, getHashtagPosts);
router.get('/:name', protect, getHashtag);

module.exports = router;
