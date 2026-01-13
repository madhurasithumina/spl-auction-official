<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../models/Player.php';

$playerModel = new Player();

// Handle DELETE request - Delete all players
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $count = $playerModel->deleteAll();
    
    http_response_code(200);
    echo json_encode([
        'message' => 'All players deleted successfully',
        'deletedCount' => $count
    ]);
}
?>
