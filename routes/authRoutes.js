const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Validation middleware
const validateRegister = [
  check('username', 'Username must be at least 3 characters long')
    .trim()
    .isLength({ min: 3 })
    .escape(),
  check('email', 'Please include a valid email')
    .isEmail()
    .normalizeEmail(),
  check('password', 'Password is required')
    .exists()
];

const validateLogin = [
  check('email', 'Please include a valid email')
    .isEmail()
    .normalizeEmail(),
  check('password', 'Password is required')
    .exists()
];

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', validateRegister, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Sanitize inputs
    const username = req.body.username.trim();
    let email = req.body.email.toLowerCase().trim();
    const password = req.body.password;

    console.log('Registration attempt:', { username, email, passwordLength: password.length });

    // Check for existing user
    const existingUser = await User.findOne({ 
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { username: { $regex: new RegExp(`^${username}$`, 'i') } }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email.toLowerCase() === email 
          ? 'Email already exists' 
          : 'Username already taken'
      });
    }

    // Create user (password will be hashed by the pre-save middleware)
    const user = await User.create({ 
      username, 
      email, 
      password 
    });

    console.log('User created successfully:', { 
      id: user._id, 
      username: user.username, 
      email: user.email,
      hasPassword: !!user.password 
    });

    // Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    // Create refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token in user document
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    console.error('[REGISTER ERROR]', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during registration' 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login existing user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { 
      email, 
      passwordLength: password.length 
    });

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', { 
      exists: !!user,
      id: user?._id,
      username: user?.username,
      hasPassword: !!user?.password
    });

    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Log password comparison attempt
    console.log('Attempting password comparison');
    const isMatch = await user.comparePassword(password);
    console.log('Password comparison result:', { 
      isMatch,
      inputPasswordLength: password.length,
      storedPasswordLength: user.password.length
    });

    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Remove password from response
    user.password = undefined;
    user.refreshToken = undefined;

    res.json({
      success: true,
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and verify refresh token
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: refreshToken
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Create new access token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    res.json({
      success: true,
      token
    });

  } catch (err) {
    console.error('[REFRESH TOKEN ERROR]', err.message);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

// Debug route to check user existence
router.get('/check-user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    res.json({
      exists: !!user,
      user: user ? {
        id: user._id,
        username: user.username,
        email: user.email
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;