<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $matchId = $_GET['match_id'] ?? null;
            
            if ($matchId) {
                // Get playing XI for a match
                $stmt = $db->prepare("
                    SELECT mxi.*, p.player_name, p.batting_style, p.bowling_style, p.photo_url, t.team_name
                    FROM match_playing_xi mxi
                    JOIN players p ON mxi.player_id = p.id
                    JOIN teams t ON mxi.team_id = t.id
                    WHERE mxi.match_id = ?
                    ORDER BY mxi.team_id, mxi.batting_order
                ");
                $stmt->execute([$matchId]);
                echo json_encode($stmt->fetchAll());
            } else {
                echo json_encode(['error' => 'Match ID required']);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $matchId = $data['match_id'];
            $teamId = $data['team_id'];
            $players = $data['players']; // Array of player objects with player_id, batting_order, is_captain, is_wicketkeeper
            
            // First remove existing playing XI for this team in this match
            $stmt = $db->prepare("DELETE FROM match_playing_xi WHERE match_id = ? AND team_id = ?");
            $stmt->execute([$matchId, $teamId]);
            
            // Insert new playing XI
            $stmt = $db->prepare("
                INSERT INTO match_playing_xi (match_id, team_id, player_id, batting_order, is_captain, is_wicketkeeper)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($players as $player) {
                $stmt->execute([
                    $matchId,
                    $teamId,
                    $player['player_id'],
                    $player['batting_order'] ?? null,
                    $player['is_captain'] ?? false,
                    $player['is_wicketkeeper'] ?? false
                ]);
            }
            
            // Also create batsman scorecard entries for this team
            $inningsStmt = $db->prepare("SELECT id FROM innings WHERE match_id = ? AND batting_team_id = ?");
            $inningsStmt->execute([$matchId, $teamId]);
            $inningsId = $inningsStmt->fetchColumn();
            
            if ($inningsId) {
                foreach ($players as $index => $player) {
                    $scorecardStmt = $db->prepare("
                        INSERT IGNORE INTO batsman_scorecard (innings_id, player_id, batting_position, status)
                        VALUES (?, ?, ?, 'yet_to_bat')
                    ");
                    $scorecardStmt->execute([$inningsId, $player['player_id'], $player['batting_order'] ?? ($index + 1)]);
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Playing XI saved successfully'
            ]);
            break;
            
        case 'DELETE':
            $matchId = $_GET['match_id'] ?? null;
            $teamId = $_GET['team_id'] ?? null;
            
            if ($matchId && $teamId) {
                $stmt = $db->prepare("DELETE FROM match_playing_xi WHERE match_id = ? AND team_id = ?");
                $stmt->execute([$matchId, $teamId]);
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['error' => 'Match ID and Team ID required']);
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
