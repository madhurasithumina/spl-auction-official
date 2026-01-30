<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../models/Team.php';

$teamModel = new Team();

// Handle GET request - Get all teams or specific team
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if specific team ID is requested
    if (isset($_GET['id'])) {
        $team = $teamModel->getById($_GET['id']);
        if ($team) {
            echo json_encode($team);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Team not found']);
        }
    } else {
        // Get all teams
        $teams = $teamModel->getAll();
        echo json_encode($teams);
    }
}
?>
