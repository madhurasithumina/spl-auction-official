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

$teamModel = new Team();

// Handle POST request - Initialize teams
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $teams = $teamModel->initialize();
    
    http_response_code(200);
    echo json_encode([
        'message' => 'Teams initialized successfully',
        'teams' => $teams
    ]);
}
?>
