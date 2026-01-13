<?php
// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/controllers/PlayerController.php';
require_once __DIR__ . '/controllers/TeamController.php';

// Get request URI and method
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string and get path
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove base path if running in subdirectory
$basePath = '/backend';
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

// Route the request
try {
    // Player routes
    if (preg_match('/^\/api\/players\/truncate$/', $path) && $requestMethod === 'DELETE') {
        $controller = new PlayerController();
        $controller->deleteAllPlayers();
    }
    elseif (preg_match('/^\/api\/players\/(\d+)$/', $path, $matches) && $requestMethod === 'GET') {
        $controller = new PlayerController();
        $controller->getPlayerById($matches[1]);
    }
    elseif (preg_match('/^\/api\/players$/', $path)) {
        $controller = new PlayerController();
        if ($requestMethod === 'POST') {
            $controller->registerPlayer();
        } elseif ($requestMethod === 'GET') {
            $controller->getAllPlayers();
        }
    }
    // Team routes
    elseif (preg_match('/^\/api\/teams\/initialize$/', $path) && $requestMethod === 'POST') {
        $controller = new TeamController();
        $controller->initializeTeams();
    }
    elseif (preg_match('/^\/api\/teams\/auction$/', $path) && $requestMethod === 'POST') {
        $controller = new TeamController();
        $controller->auctionPlayer();
    }
    elseif (preg_match('/^\/api\/teams\/truncate$/', $path) && $requestMethod === 'DELETE') {
        $controller = new TeamController();
        $controller->resetAllTeams();
    }
    elseif (preg_match('/^\/api\/teams\/([^\/]+)\/reset$/', $path, $matches) && $requestMethod === 'PUT') {
        $controller = new TeamController();
        $controller->resetTeamBudget($matches[1]);
    }
    elseif (preg_match('/^\/api\/teams\/([^\/]+)$/', $path, $matches) && $requestMethod === 'GET') {
        $controller = new TeamController();
        $controller->getTeamByName($matches[1]);
    }
    elseif (preg_match('/^\/api\/teams$/', $path) && $requestMethod === 'GET') {
        $controller = new TeamController();
        $controller->getAllTeams();
    }
    // Root route
    elseif ($path === '/' || $path === '/api' || $path === '') {
        http_response_code(200);
        echo json_encode(['message' => 'SPL Auction API is running']);
    }
    // 404 Not Found
    else {
        http_response_code(404);
        echo json_encode(['message' => 'Route not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
?>
