const express = require('express');
const router = express.Router();
const {
  getHighlights,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  getHighlightStories
} = require('../controllers/highlightController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/:userId', getHighlights);
router.get('/:id/stories', getHighlightStories);

// Private routes
router.post('/', protect, createHighlight);
router.put('/:id', protect, updateHighlight);
router.delete('/:id', protect, deleteHighlight);

module.exports = router;
