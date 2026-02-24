const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { createPost, getFeed, toggleLike, addComment, followUser } = require('../controllers/postController');

const router = express.Router();

router.get('/feed', protect, getFeed);
router.post('/', protect, upload.single('media'), [body('caption').optional().isString()], createPost);
router.post('/:postId/like', protect, toggleLike);
router.post('/:postId/comments', protect, [body('text').isLength({ min: 1, max: 300 }).trim().escape()], addComment);
router.post('/users/:userId/follow', protect, followUser);

module.exports = router;
