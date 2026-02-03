<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/database.php';

$db = Database::getInstance()->getConnection();

// Get Team Isuru's data
$stmt = $db->prepare("
    SELECT t.team_name, pt.*, 
           GROUP_CONCAT(CONCAT('Match ', tms.match_id, ': Scored ', tms.runs_scored, '/', tms.overs_faced, 
                               ' Conceded ', tms.runs_conceded, '/', tms.overs_bowled, 
                               ' Result: ', tms.result_type) SEPARATOR ' | ') as match_details
    FROM points_table pt 
    LEFT JOIN teams t ON pt.team_id = t.id 
    LEFT JOIN team_match_stats tms ON pt.team_id = tms.team_id
    WHERE t.team_name LIKE '%Isuru%'
    GROUP BY pt.id
");
$stmt->execute();
$result = $stmt->fetch(PDO::FETCH_ASSOC);

if ($result) {
    // Calculate manually
    $run_rate_for = $result['overs_faced'] > 0 ? $result['runs_scored'] / $result['overs_faced'] : 0;
    $run_rate_against = $result['overs_bowled'] > 0 ? $result['runs_conceded'] / $result['overs_bowled'] : 0;
    $calculated_nrr = $run_rate_for - $run_rate_against;
    
    echo json_encode([
        'team' => $result['team_name'],
        'data' => [
            'runs_scored' => $result['runs_scored'],
            'overs_faced' => $result['overs_faced'],
            'runs_conceded' => $result['runs_conceded'],
            'overs_bowled' => $result['overs_bowled'],
            'run_rate_for' => round($run_rate_for, 3),
            'run_rate_against' => round($run_rate_against, 3),
            'calculated_nrr' => round($calculated_nrr, 3),
            'stored_nrr' => $result['nrr'],
            'matches_played' => $result['matches_played'],
            'matches_won' => $result['matches_won']
        ],
        'match_details' => $result['match_details']
    ], JSON_PRETTY_PRINT);
} else {
    echo json_encode(['error' => 'Team Isuru not found']);
}
?>
