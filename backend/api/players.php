<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../models/Player.php';

$playerModel = new Player();

// Handle GET request - Get all players
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $players = $playerModel->getAll();
    echo json_encode($players);
}

// Handle POST request - Register new player
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['playerName']) || empty($data['battingSide']) || 
        empty($data['age']) || empty($data['bowlingSide']) || empty($data['bowlingStyle'])) {
        http_response_code(400);
        echo json_encode(['message' => 'All fields are required']);
        exit();
    }
    
    if ($data['age'] < 10 || $data['age'] > 60) {
        http_response_code(400);
        echo json_encode(['message' => 'Age must be between 10 and 60']);
        exit();
    }
    
    $player = $playerModel->create($data);
    
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
?>
