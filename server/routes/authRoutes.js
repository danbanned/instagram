const express = require('express');
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  register
);

router.post('/login', [body('email').isEmail().normalizeEmail(), body('password').notEmpty()], login);
router.get('/me', protect, me);

module.exports = router;
