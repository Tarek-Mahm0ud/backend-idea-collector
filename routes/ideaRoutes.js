const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Idea = require('../models/Idea');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateIdea = [
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .escape()
];

// @route   GET /api/ideas
// @desc    Get all ideas
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const ideas = await Idea.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Idea.countDocuments();

    res.json({
      success: true,
      data: ideas,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalIdeas: total
      }
    });
  } catch (err) {
    console.error('Error fetching ideas:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ideas'
    });
  }
});

// @route   POST /api/ideas
// @desc    Create new idea
router.post('/', auth, validateIdea, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Add null checks
    if (!req.user?.username || !req.user?.email) {
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
    console.error('Idea creation error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create idea'
    });
  }
});

// @route   DELETE /api/ideas/:id
// @desc    Delete an idea
router.delete('/:id', auth, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    
    if (!idea) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found'
      });
    }

    // Check if user owns the idea
    if (idea.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this idea'
      });
    }

    await idea.remove();
    res.json({
      success: true,
      message: 'Idea deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting idea:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete idea'
    });
  }
});

module.exports = router;