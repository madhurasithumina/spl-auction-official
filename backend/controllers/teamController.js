const Team = require('../models/Team');
const Player = require('../models/Player');

// Initialize teams with default budget
const initializeTeams = async (req, res) => {
  try {
    const teamNames = ['Software', 'Marketing', 'Technical', 'Accounts'];
    const teams = [];

    for (const name of teamNames) {
      let team = await Team.findOne({ teamName: name });
      if (!team) {
        team = new Team({
          teamName: name,
          initialBudget: 10000,
          remainingBudget: 10000
        });
        await team.save();
      }
      teams.push(team);
    }

    res.status(200).json({
      message: 'Teams initialized successfully',
      teams
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all teams with their players
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate('players');
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single team by name
const getTeamByName = async (req, res) => {
  try {
    const team = await Team.findOne({ teamName: req.params.name }).populate('players');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Auction a player to a team
const auctionPlayer = async (req, res) => {
  try {
    const { playerId, teamName, soldValue, soldStatus, playerRole } = req.body;

    // Validate required fields
    if (!playerId || !soldStatus) {
      return res.status(400).json({ message: 'Player ID and sold status are required' });
    }

    // Find player
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Check if player is already sold
    if (player.soldStatus === 'Sold') {
      return res.status(400).json({ message: 'Player is already sold' });
    }

    if (soldStatus === 'Sold') {
      // Validate team and sold value for sold players
      if (!teamName) {
        return res.status(400).json({ message: 'Team name is required for sold players' });
      }

      // Find team
      const team = await Team.findOne({ teamName }).populate('players');
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      // Check if player role is Captain or Manager (hold players with 0 value)
      if (playerRole === 'Captain' || playerRole === 'Manager') {
        // Validate only 2 hold players per team
        const holdPlayers = team.players.filter(p => 
          p.playerRole === 'Captain' || p.playerRole === 'Manager'
        );

        if (holdPlayers.length >= 2) {
          return res.status(400).json({ 
            message: `${teamName} already has 2 hold players (Captain and Manager)!` 
          });
        }

        // Check if role already exists in team
        const roleExists = team.players.some(p => p.playerRole === playerRole);
        if (roleExists) {
          return res.status(400).json({ 
            message: `${teamName} already has a ${playerRole}!` 
          });
        }

        // Hold players have 0 value, no budget deduction
        player.soldValue = 0;
        player.playerRole = playerRole;
      } else {
        // Regular player with sold value
        if (soldValue === undefined || soldValue === null) {
          return res.status(400).json({ message: 'Sold value is required for regular players' });
        }

        // Check if team has enough budget
        if (team.remainingBudget < soldValue) {
          return res.status(400).json({ 
            message: `Insufficient budget! ${teamName} has only LKR ${team.remainingBudget} remaining` 
          });
        }

        // Update team budget
        team.remainingBudget -= soldValue;
        player.soldValue = soldValue;
        player.playerRole = 'Regular';
      }

      // Add player to team
      team.players.push(player._id);
      await team.save();

      // Update player
      player.soldStatus = 'Sold';
      player.soldTeam = teamName;
    } else {
      // Mark as unsold
      player.soldStatus = 'Unsold';
      player.soldValue = 0;
      player.soldTeam = '';
      player.playerRole = '';
    }

    await player.save();

    res.status(200).json({
      message: soldStatus === 'Sold' 
        ? `${player.playerName} sold to ${teamName} ${playerRole ? `as ${playerRole}` : ''} for LKR ${player.soldValue}!` 
        : `${player.playerName} marked as unsold`,
      player
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset team budget
const resetTeamBudget = async (req, res) => {
  try {
    const { teamName } = req.params;
    const team = await Team.findOne({ teamName });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    team.remainingBudget = team.initialBudget;
    team.players = [];
    await team.save();

    res.status(200).json({
      message: `${teamName} budget reset successfully`,
      team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset all teams (truncate players and reset budgets)
const resetAllTeams = async (req, res) => {
  try {
    const teams = await Team.find();
    
    for (const team of teams) {
      team.remainingBudget = team.initialBudget;
      team.players = [];
      await team.save();
    }

    res.status(200).json({
      message: 'All teams reset successfully',
      teams
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  initializeTeams,
  getAllTeams,
  getTeamByName,
  auctionPlayer,
  resetTeamBudget,
  resetAllTeams
};
