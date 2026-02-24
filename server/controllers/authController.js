const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password } = req.body;
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: hashed });
  const token = generateToken(user._id);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio
    }
  });
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = generateToken(user._id);
  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio
    }
  });
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };
