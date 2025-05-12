const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  description: {
    type: String,
    required: [true, 'Idea description is required'],
    trim: true
  },
  },{
  timestamps: true
});

// Index for better query performance
ideaSchema.index({ username: 1, createdAt: -1 });
ideaSchema.index({ email: 1, createdAt: -1 });
ideaSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Idea', ideaSchema);