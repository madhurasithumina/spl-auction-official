const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerName: {
    type: String,
    required: true,
    trim: true
  },
  battingSide: {
    type: String,
    required: true,
    enum: ['RHB', 'LHB']
  },
  age: {
    type: Number,
    required: true,
    min: 10,
    max: 60
  },
  bowlingSide: {
    type: String,
    required: true,
    enum: ['RHB', 'LHB']
  },
  bowlingStyle: {
    type: String,
    required: true,
    enum: ['Fast Bowling', 'Medium Fast', 'Off Spin', 'Leg Spin']
  },
  soldStatus: {
    type: String,
    enum: ['Sold', 'Unsold', 'Available'],
    default: 'Available'
  },
  soldValue: {
    type: Number,
    default: 0
  },
  soldTeam: {
    type: String,
    enum: ['Software', 'Marketing', 'Technical', 'Accounts', ''],
    default: ''
  },
  playerRole: {
    type: String,
    enum: ['Captain', 'Manager', 'Regular', ''],
    default: ''
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Player', playerSchema);
