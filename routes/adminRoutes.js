const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Idea = require('../models/Idea');

const getUsersCount = (users) => {
  if (!Array.isArray(users)) {
    throw new Error('Input must be an array');
  }
  return users.length;
};

const isValidEmailNoSpecialChars = (email) => {
  if (typeof email !== 'string') throw new Error('Email must be a string');
  const regex = /^[a-zA-Z0-9@._-]+$/;
  if (!regex.test(email)) {
    throw new Error('Email contains invalid special characters');
  }
  return email;
};

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


router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const count = getUsersCount(users);
    res.json({ success: true, users, count });
  } catch (error) {
    console.error('Error in /users endpoint:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});


router.get('/ideas', async (req, res) => {
  try {
    const ideas = await Idea.find();
    res.json({ success: true, ideas });
  } catch (error) {
    //console.error('Error fetching ideas:', error);
    res.status(500).json({ success: false, message: 'Error fetching ideas' });
  }
});


router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    
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
module.exports.getUsersCount = getUsersCount;
module.exports.isValidEmailNoSpecialChars = isValidEmailNoSpecialChars; 