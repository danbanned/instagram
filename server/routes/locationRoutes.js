const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { searchLocations } = require('../controllers/locationController');

const router = express.Router();

router.get('/search', protect, searchLocations);

module.exports = router;
