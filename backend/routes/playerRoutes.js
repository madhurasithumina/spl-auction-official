const express = require('express');
const router = express.Router();
const {
  registerPlayer,
  getAllPlayers,
  getPlayerById
} = require('../controllers/playerController');

// POST /api/players - Register a new player
router.post('/', registerPlayer);

// GET /api/players - Get all players
router.get('/', getAllPlayers);

// GET /api/players/:id - Get player by ID
router.get('/:id', getPlayerById);

module.exports = router;
