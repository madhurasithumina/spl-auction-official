<?php
require_once __DIR__ . '/../models/Player.php';

class PlayerController {
    private $playerModel;
    
    public function __construct() {
        $this->playerModel = new Player();
    }
    
    // Register a new player
    public function registerPlayer() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (empty($data['playerName']) || empty($data['battingSide']) || 
            empty($data['age']) || empty($data['bowlingSide']) || empty($data['bowlingStyle'])) {
            http_response_code(400);
            echo json_encode(['message' => 'All fields are required']);
            return;
        }
        
        // Validate age
        if ($data['age'] < 10 || $data['age'] > 60) {
            http_response_code(400);
            echo json_encode(['message' => 'Age must be between 10 and 60']);
            return;
        }
        
        $player = $this->playerModel->create($data);
        
        if ($player) {
            http_response_code(201);
            echo json_encode([
                'message' => 'Player registered successfully',
                'player' => $player
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to register player']);
        }
    }
    
    // Get all players
    public function getAllPlayers() {
        $players = $this->playerModel->getAll();
        http_response_code(200);
        echo json_encode($players);
    }
    
    // Get player by ID
    public function getPlayerById($id) {
        $player = $this->playerModel->getById($id);
        
        if ($player) {
            http_response_code(200);
            echo json_encode($player);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Player not found']);
        }
    }
    
    // Delete all players
    public function deleteAllPlayers() {
        $count = $this->playerModel->deleteAll();
        
        http_response_code(200);
        echo json_encode([
            'message' => 'All players deleted successfully',
            'deletedCount' => $count
        ]);
    }
}
?>
