const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markRead } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/read', protect, markRead);

module.exports = router;
