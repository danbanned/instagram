const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getStoryTray,
  markStorySeen,
  getUserStories,
  createStory,
  deleteStory,
  replyToStory,
  addReaction,
  trackView,
} = require('../controllers/storyController');

const router = express.Router();

router.get('/tray', protect, getStoryTray);
router.get('/user/:userId', protect, getUserStories);
router.post('/', protect, upload.single('media'), createStory);
router.post('/:storyId/seen', protect, markStorySeen);
router.post('/:storyId/view', protect, trackView);
router.post('/:storyId/reply', protect, replyToStory);
router.post('/:storyId/reaction', protect, addReaction);
router.delete('/:storyId', protect, deleteStory);

module.exports = router;
