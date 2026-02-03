<?php
/**
 * Clear all match and points table data
 * This will reset matches, innings, and points table to start fresh
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../config/database.php';

$db = Database::getInstance()->getConnection();

try {
    $db->beginTransaction();
    
    // Clear all match-related data
    $tables_to_clear = [
        'ball_by_ball',
        'fall_of_wickets',
        'partnerships',
        'batsman_scorecard',
        'bowler_scorecard',
        'match_state',
        'team_match_stats',
        'innings',
        'match_stages',
        'matches'
    ];
    
    foreach ($tables_to_clear as $table) {
        $stmt = $db->prepare("DELETE FROM $table");
        $stmt->execute();
    }
    
    // Reset points table
    $stmt = $db->prepare("
        UPDATE points_table SET 
            matches_played = 0,
            matches_won = 0,
            matches_lost = 0,
            matches_tied = 0,
            matches_nr = 0,
            points = 0,
            runs_scored = 0,
            overs_faced = 0,
            runs_conceded = 0,
            overs_bowled = 0,
            nrr = 0,
            position = 0
    ");
    $stmt->execute();
    
    // Reset auto increment for matches
    $stmt = $db->prepare("ALTER TABLE matches AUTO_INCREMENT = 1");
    $stmt->execute();
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'All match and points table data cleared successfully',
        'cleared_tables' => $tables_to_clear,
        'reset_tables' => ['points_table']
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
