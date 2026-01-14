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

// Handle POST request - Register new player or Update existing player
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if request contains file upload
    if (isset($_FILES['profileImage'])) {
        // Handle multipart/form-data
        $data = $_POST;
    } else {
        // Handle JSON data
        $data = json_decode(file_get_contents('php://input'), true);
    }
    
    // Check if this is an update request
    $isUpdate = isset($data['_method']) && $data['_method'] === 'PUT' && isset($data['playerId']);
    
    if (!$isUpdate) {
        // Validation for new player registration
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
        $successMessage = 'Player registered successfully';
    } else {
        // Update existing player
        $playerId = $data['playerId'];
        
        // Prepare update data (only include fields that are present)
        $updateData = [];
        if (!empty($data['playerName'])) $updateData['playerName'] = $data['playerName'];
        if (!empty($data['battingSide'])) $updateData['battingSide'] = $data['battingSide'];
        if (!empty($data['age'])) {
            if ($data['age'] < 10 || $data['age'] > 60) {
                http_response_code(400);
                echo json_encode(['message' => 'Age must be between 10 and 60']);
                exit();
            }
            $updateData['age'] = $data['age'];
        }
        if (!empty($data['bowlingSide'])) $updateData['bowlingSide'] = $data['bowlingSide'];
        if (!empty($data['bowlingStyle'])) $updateData['bowlingStyle'] = $data['bowlingStyle'];
        
        $success = $playerModel->update($playerId, $updateData);
        if ($success) {
            $player = $playerModel->getById($playerId);
            $successMessage = 'Player updated successfully';
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update player']);
            exit();
        }
    }
    
    if ($player) {
        // Handle profile image upload if provided
        if (isset($_FILES['profileImage']) && $_FILES['profileImage']['error'] === UPLOAD_ERR_OK) {
            // Use absolute path from document root
            $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/assets/Images/players/';
            
            // Create directory if it doesn't exist
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            $playerId = $player['id'];
            
            // Get file extension
            $imageFileType = strtolower(pathinfo($_FILES['profileImage']['name'], PATHINFO_EXTENSION));
            
            // Validate image type
            $allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (!in_array($imageFileType, $allowedTypes)) {
                http_response_code(400);
                echo json_encode(['message' => 'Only JPG, JPEG, PNG, GIF & WEBP files are allowed']);
                exit();
            }
            
            // Validate it's a real image
            $check = getimagesize($_FILES['profileImage']['tmp_name']);
            if ($check === false) {
                http_response_code(400);
                echo json_encode(['message' => 'File is not a valid image']);
                exit();
            }
            
            // Check file size (max 5MB)
            if ($_FILES['profileImage']['size'] > 5 * 1024 * 1024) {
                http_response_code(400);
                echo json_encode(['message' => 'Image size should be less than 5MB']);
                exit();
            }
            
            // Set target file as .png (all images saved as .png)
            $targetFile = $uploadDir . $playerId . '.png';
            
            // Simply move the uploaded file
            if (!move_uploaded_file($_FILES['profileImage']['tmp_name'], $targetFile)) {
                http_response_code(500);
                echo json_encode(['message' => 'Failed to save image']);
                exit();
            }
        }
        
        http_response_code($isUpdate ? 200 : 201);
        echo json_encode([
            'message' => $successMessage,
            'player' => $player
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['message' => $isUpdate ? 'Failed to update player' : 'Failed to register player']);
    }
}
?>
