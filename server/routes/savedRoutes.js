const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getSavedPosts, toggleSavedPost } = require('../controllers/savedController');

const router = express.Router();

router.get('/', protect, getSavedPosts);
router.post('/', protect, toggleSavedPost);

module.exports = router;
