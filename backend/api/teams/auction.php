<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../models/Team.php';
require_once __DIR__ . '/../../models/Player.php';

$teamModel = new Team();
$playerModel = new Player();

// Handle POST request - Auction player
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['playerId']) || empty($data['soldStatus'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Player ID and sold status are required']);
        exit();
    }
    
    $playerId = $data['playerId'];
    $soldStatus = $data['soldStatus'];
    $teamName = $data['teamName'] ?? '';
    $soldValue = $data['soldValue'] ?? 0;
    $playerRole = $data['playerRole'] ?? 'Regular';
    
    $player = $playerModel->getById($playerId);
    if (!$player) {
        http_response_code(404);
        echo json_encode(['message' => 'Player not found']);
        exit();
    }
    
    if ($player['sold_status'] === 'Sold') {
        http_response_code(400);
        echo json_encode(['message' => 'Player is already sold']);
        exit();
    }
    
    if ($soldStatus === 'Sold') {
        if (empty($teamName)) {
            http_response_code(400);
            echo json_encode(['message' => 'Team name is required for sold players']);
            exit();
        }
        
        $team = $teamModel->getByName($teamName);
        if (!$team) {
            http_response_code(404);
            echo json_encode(['message' => 'Team not found']);
            exit();
        }
        
        if ($playerRole === 'Captain' || $playerRole === 'Manager') {
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
                exit();
            }
            
            if ($roleExists) {
                http_response_code(400);
                echo json_encode(['message' => "{$teamName} already has a {$playerRole}!"]);
                exit();
            }
            
            $soldValue = 0;
        } else {
            if ($soldValue <= 0) {
                http_response_code(400);
                echo json_encode(['message' => 'Sold value is required for regular players']);
                exit();
            }
            
            if ($team['remaining_budget'] < $soldValue) {
                http_response_code(400);
                echo json_encode([
                    'message' => "Insufficient budget! {$teamName} has only LKR {$team['remaining_budget']} remaining"
                ]);
                exit();
            }
            
            $teamModel->updateBudget($teamName, $soldValue);
        }
        
        $updateData = [
            'soldStatus' => 'Sold',
            'soldTeam' => $teamName,
            'soldValue' => $soldValue,
            'playerRole' => $playerRole
        ];
        
        $playerModel->update($playerId, $updateData);
        
        $message = "{$player['player_name']} sold to {$teamName}";
        if ($playerRole !== 'Regular') {
            $message .= " as {$playerRole}";
        }
        $message .= " for LKR {$soldValue}!";
        
    } else {
        $updateData = [
            'soldStatus' => 'Unsold',
            'soldTeam' => '',
            'soldValue' => 0,
            'playerRole' => ''
        ];
        
        $playerModel->update($playerId, $updateData);
        $message = "{$player['player_name']} marked as unsold";
    }
    
    $updatedPlayer = $playerModel->getById($playerId);
    
    http_response_code(200);
    echo json_encode([
        'message' => $message,
        'player' => $updatedPlayer
    ]);
}
?>
