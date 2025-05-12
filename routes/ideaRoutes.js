const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Idea = require('../models/Idea');
const { body, validationResult } = require('express-validator');


const validateIdea = [
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .escape()
];

// @route   POST /api/ideas
router.post('/', auth, validateIdea, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.user?.email) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user data in token'
      });
    }

    const idea = await Idea.create({
      username: req.user.username,
      email: req.user.email,
      description: req.body.description
    });

    res.status(201).json({
      success: true,
      data: idea
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to create idea'
    });
  }
});


module.exports = router;