const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
router.post('/register', validateRegister, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {

    const username = req.body.username.trim();
    let email = req.body.email.toLowerCase().trim();
    const password = req.body.password;

    console.log('Registration attempt:', { username, email, passwordLength: password.length });

    
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

   
    const token = jwt.sign(
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
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;


    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }


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


    const accessToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn:  '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );


    user.refreshToken = refreshToken;
    await user.save();


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

module.exports = router;