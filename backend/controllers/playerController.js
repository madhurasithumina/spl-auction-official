const Player = require('../models/Player');

// Register a new player
const registerPlayer = async (req, res) => {
  try {
    const { playerName, battingSide, age, bowlingSide, bowlingStyle } = req.body;

    // Validate required fields
    if (!playerName || !battingSide || !age || !bowlingSide || !bowlingStyle) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create new player
    const player = new Player({
      playerName,
      battingSide,
      age,
      bowlingSide,
      bowlingStyle
    });

    const savedPlayer = await player.save();
    res.status(201).json({
      message: 'Player registered successfully',
      player: savedPlayer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all players
const getAllPlayers = async (req, res) => {
  try {
    const players = await Player.find().sort({ registeredAt: -1 });
    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single player by ID
const getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.status(200).json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerPlayer,
  getAllPlayers,
  getPlayerById
};
