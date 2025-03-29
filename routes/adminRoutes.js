const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Idea = require('../models/Idea');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.email !== 'tarek@gmail.com') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error in admin check' });
  }
};

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Get all ideas
router.get('/ideas', isAdmin, async (req, res) => {
  try {
    const ideas = await Idea.find();
    res.json({ success: true, ideas });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    res.status(500).json({ success: false, message: 'Error fetching ideas' });
  }
});

// Delete user
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Don't allow deleting the admin
    if (user.email === 'tarek@gmail.com') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin user' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// Delete idea
router.delete('/ideas/:id', isAdmin, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({ success: false, message: 'Idea not found' });
    }

    await Idea.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Idea deleted successfully' });
  } catch (error) {
    console.error('Error deleting idea:', error);
    res.status(500).json({ success: false, message: 'Error deleting idea' });
  }
});

module.exports = router; 