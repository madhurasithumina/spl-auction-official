<?php
/**
 * Utility script to update points table for all completed matches
 * Use this if matches were completed before automatic points update was implemented
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/points.php';

$db = Database::getInstance()->getConnection();
$tournamentController = new TournamentController($db);

try {
    // Get all completed matches
    $query = "SELECT m.id, m.team1_id, m.team2_id, m.winner_id, m.status, ms.stage
              FROM matches m
              LEFT JOIN match_stages ms ON m.id = ms.match_id
              WHERE m.status = 'completed'
              ORDER BY m.id";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $updated = 0;
    $skipped = 0;
    $failed = 0;
    $results = [];
    
    foreach ($matches as $match) {
        $stage = $match['stage'] ?? 'group_stage';
        
        // Skip playoff matches
        if ($stage !== 'group_stage' && $stage !== null) {
            $skipped++;
            $results[] = [
                'match_id' => $match['id'],
                'status' => 'skipped',
                'reason' => 'playoff_match'
            ];
            continue;
        }
        
        // Try to update points
        $result = $tournamentController->updatePointsTable($match['id']);
        
        if ($result['success']) {
            if (strpos($result['message'], 'already updated') !== false) {
                $skipped++;
                $results[] = [
                    'match_id' => $match['id'],
                    'status' => 'skipped',
                    'reason' => 'already_updated'
                ];
            } else {
                $updated++;
                $results[] = [
                    'match_id' => $match['id'],
                    'status' => 'updated',
                    'message' => $result['message']
                ];
            }
        } else {
            $failed++;
            $results[] = [
                'match_id' => $match['id'],
                'status' => 'failed',
                'error' => $result['message']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'summary' => [
            'total_matches' => count($matches),
            'updated' => $updated,
            'skipped' => $skipped,
            'failed' => $failed
        ],
        'details' => $results
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
