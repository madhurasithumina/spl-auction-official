<?php
require_once __DIR__ . '/../models/Team.php';
require_once __DIR__ . '/../models/Player.php';

class TeamController {
    private $teamModel;
    private $playerModel;
    
    public function __construct() {
        $this->teamModel = new Team();
        $this->playerModel = new Player();
    }
    
    // Initialize teams
    public function initializeTeams() {
        $teams = $this->teamModel->initialize();
        
        http_response_code(200);
        echo json_encode([
            'message' => 'Teams initialized successfully',
            'teams' => $teams
        ]);
    }
    
    // Get all teams
    public function getAllTeams() {
        $teams = $this->teamModel->getAll();
        http_response_code(200);
        echo json_encode($teams);
    }
    
    // Get team by name
    public function getTeamByName($teamName) {
        $team = $this->teamModel->getByName($teamName);
        
        if ($team) {
            http_response_code(200);
            echo json_encode($team);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Team not found']);
        }
    }
    
    // Auction a player to a team
    public function auctionPlayer() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (empty($data['playerId']) || empty($data['soldStatus'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Player ID and sold status are required']);
            return;
        }
        
        $playerId = $data['playerId'];
        $soldStatus = $data['soldStatus'];
        $teamName = $data['teamName'] ?? '';
        $soldValue = $data['soldValue'] ?? 0;
        $playerRole = $data['playerRole'] ?? 'Regular';
        
        // Get player
        $player = $this->playerModel->getById($playerId);
        if (!$player) {
            http_response_code(404);
            echo json_encode(['message' => 'Player not found']);
            return;
        }
        
        // Check if player is already sold
        if ($player['sold_status'] === 'Sold') {
            http_response_code(400);
            echo json_encode(['message' => 'Player is already sold']);
            return;
        }
        
        if ($soldStatus === 'Sold') {
            // Validate team
            if (empty($teamName)) {
                http_response_code(400);
                echo json_encode(['message' => 'Team name is required for sold players']);
                return;
            }
            
            // Get team
            $team = $this->teamModel->getByName($teamName);
            if (!$team) {
                http_response_code(404);
                echo json_encode(['message' => 'Team not found']);
                return;
            }
            
            // Check for hold players (Captain or Manager)
            if ($playerRole === 'Captain' || $playerRole === 'Manager') {
                // Count hold players
                $holdCount = 0;
                $roleExists = false;
                foreach ($team['players'] as $p) {
                    if ($p['player_role'] === 'Captain' || $p['player_role'] === 'Manager') {
                        $holdCount++;
                    }
                    if ($p['player_role'] === $playerRole) {
                        $roleExists = true;
                    }
                }
                
                if ($holdCount >= 2) {
                    http_response_code(400);
                    echo json_encode(['message' => "{$teamName} already has 2 hold players (Captain and Manager)!"]);
                    return;
                }
                
                if ($roleExists) {
                    http_response_code(400);
                    echo json_encode(['message' => "{$teamName} already has a {$playerRole}!"]);
                    return;
                }
                
                // Hold players have 0 value
                $soldValue = 0;
            } else {
                // Regular player - check budget
                if ($soldValue <= 0) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Sold value is required for regular players']);
                    return;
                }
                
                if ($team['remaining_budget'] < $soldValue) {
                    http_response_code(400);
                    echo json_encode([
                        'message' => "Insufficient budget! {$teamName} has only LKR {$team['remaining_budget']} remaining"
                    ]);
                    return;
                }
                
                // Deduct budget
                $this->teamModel->updateBudget($teamName, $soldValue);
            }
            
            // Update player
            $updateData = [
                'soldStatus' => 'Sold',
                'soldTeam' => $teamName,
                'soldValue' => $soldValue,
                'playerRole' => $playerRole
            ];
            
            $this->playerModel->update($playerId, $updateData);
            
            $message = "{$player['player_name']} sold to {$teamName}";
            if ($playerRole !== 'Regular') {
                $message .= " as {$playerRole}";
            }
            $message .= " for LKR {$soldValue}!";
            
        } else {
            // Mark as unsold
            $updateData = [
                'soldStatus' => 'Unsold',
                'soldTeam' => '',
                'soldValue' => 0,
                'playerRole' => ''
            ];
            
            $this->playerModel->update($playerId, $updateData);
            $message = "{$player['player_name']} marked as unsold";
        }
        
        $updatedPlayer = $this->playerModel->getById($playerId);
        
        http_response_code(200);
        echo json_encode([
            'message' => $message,
            'player' => $updatedPlayer
        ]);
    }
    
    // Reset team budget
    public function resetTeamBudget($teamName) {
        $team = $this->teamModel->getByName($teamName);
        
        if (!$team) {
            http_response_code(404);
            echo json_encode(['message' => 'Team not found']);
            return;
        }
        
        $this->teamModel->resetBudget($teamName);
        
        // Reset players
        $db = Database::getInstance()->getConnection();
        $query = "UPDATE players SET sold_status = 'Available', sold_team = '', sold_value = 0, player_role = '' 
                  WHERE sold_team = :team_name";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':team_name', $teamName);
        $stmt->execute();
        
        $updatedTeam = $this->teamModel->getByName($teamName);
        
        http_response_code(200);
        echo json_encode([
            'message' => "{$teamName} budget reset successfully",
            'team' => $updatedTeam
        ]);
    }
    
    // Reset all teams
    public function resetAllTeams() {
        $teams = $this->teamModel->resetAll();
        
        http_response_code(200);
        echo json_encode([
            'message' => 'All teams reset successfully',
            'teams' => $teams
        ]);
    }
}
?>
