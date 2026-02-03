<?php
/**
 * Recalculate NRR for all teams with correct formula
 * When a team wins by wickets, they get full overs quota for NRR calculation
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/points.php';

$db = Database::getInstance()->getConnection();

try {
    // Clear team_match_stats to recalculate from scratch
    $stmt = $db->prepare("TRUNCATE TABLE team_match_stats");
    $stmt->execute();
    
    // Reset points table
    $stmt = $db->prepare("UPDATE points_table SET 
        matches_played = 0, matches_won = 0, matches_lost = 0, matches_tied = 0,
        points = 0, runs_scored = 0, overs_faced = 0, runs_conceded = 0, overs_bowled = 0, nrr = 0
        WHERE tournament_id = 1");
    $stmt->execute();
    
    // Get all completed matches
    $stmt = $db->prepare("SELECT id FROM matches WHERE status = 'completed' ORDER BY id");
    $stmt->execute();
    $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $controller = new TournamentController($db);
    $results = [];
    
    foreach ($matches as $match) {
        $result = $controller->updatePointsTable($match['id']);
        $results[] = [
            'match_id' => $match['id'],
            'status' => $result['success'] ? 'success' : 'failed',
            'message' => $result['message']
        ];
    }
    
    // Get updated points table
    $stmt = $db->prepare("
        SELECT t.team_name, pt.matches_played, pt.matches_won, pt.matches_lost, 
               pt.runs_scored, pt.overs_faced, pt.runs_conceded, pt.overs_bowled, pt.nrr, pt.points
        FROM points_table pt
        JOIN teams t ON pt.team_id = t.id
        WHERE pt.tournament_id = 1
        ORDER BY pt.points DESC, pt.nrr DESC
    ");
    $stmt->execute();
    $standings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add detailed explanation for each team
    $standings_explained = [];
    foreach ($standings as $team) {
        $rrf = $team['overs_faced'] > 0 ? $team['runs_scored'] / $team['overs_faced'] : 0;
        $rra = $team['overs_bowled'] > 0 ? $team['runs_conceded'] / $team['overs_bowled'] : 0;
        $standings_explained[] = array_merge($team, [
            'nrr_calculation' => sprintf(
                '(%d runs / %.1f overs) - (%d runs / %.1f overs) = %.2f - %.2f = %.3f',
                $team['runs_scored'], $team['overs_faced'],
                $team['runs_conceded'], $team['overs_bowled'],
                $rrf, $rra, $team['nrr']
            )
        ]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'All NRR values recalculated with correct formula',
        'explanation' => 'When a team wins by wickets, their overs faced is counted as full quota for fair NRR calculation',
        'matches_processed' => count($results),
        'updated_standings' => $standings_explained,
        'match_details' => $results
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
