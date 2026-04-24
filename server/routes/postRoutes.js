const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { createPost, getFeed, toggleLike, addComment, getComments, deleteComment, toggleCommentLike, toggleSave, followUser, recordShare } = require('../controllers/postController');

const router = express.Router();

// Static / prefix routes first to avoid param conflicts
router.get('/feed', protect, getFeed);
router.post('/users/:userId/follow', protect, followUser);
router.delete('/comments/:commentId', protect, deleteComment);
router.post('/comments/:commentId/like', protect, toggleCommentLike);

// Parameterized post routes
router.post('/', protect, upload.single('media'), [body('caption').optional().isString()], createPost);
router.get('/:postId/comments', protect, getComments);
router.post('/:postId/like', protect, toggleLike);
router.post('/:postId/comments', protect, [body('text').isLength({ min: 1, max: 300 }).trim()], addComment);
router.post('/:postId/save',  protect, toggleSave);
router.post('/:postId/share', protect, recordShare);

module.exports = router;
