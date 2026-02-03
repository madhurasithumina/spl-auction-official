<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/database.php';

$db = Database::getInstance()->getConnection();

// Get Team Isuru's matches and innings
$stmt = $db->prepare("
    SELECT m.id as match_id, m.status, m.winner_id,
           t1.team_name as team1_name, t2.team_name as team2_name,
           i1.innings_number as inn1_num, i1.batting_team_id as inn1_team,
           i1.total_runs as inn1_runs, i1.total_overs as inn1_overs, i1.total_balls as inn1_balls,
           i2.innings_number as inn2_num, i2.batting_team_id as inn2_team,
           i2.total_runs as inn2_runs, i2.total_overs as inn2_overs, i2.total_balls as inn2_balls,
           ti.id as isuru_id, ti.team_name as isuru_name
    FROM matches m
    JOIN teams t1 ON m.team1_id = t1.id
    JOIN teams t2 ON m.team2_id = t2.id
    LEFT JOIN innings i1 ON m.id = i1.match_id AND i1.innings_number = 1
    LEFT JOIN innings i2 ON m.id = i2.match_id AND i2.innings_number = 2
    JOIN teams ti ON ti.team_name LIKE '%Isuru%'
    WHERE (m.team1_id = ti.id OR m.team2_id = ti.id)
    AND m.status = 'completed'
");
$stmt->execute();
$matches = $stmt->fetchAll(PDO::FETCH_ASSOC);

$details = [];
foreach ($matches as $match) {
    $isuru_id = $match['isuru_id'];
    
    // Determine which innings Isuru batted and bowled
    if ($match['inn1_team'] == $isuru_id) {
        $batted = ['runs' => $match['inn1_runs'], 'overs' => $match['inn1_overs'], 'balls' => $match['inn1_balls']];
        $bowled = ['runs' => $match['inn2_runs'], 'overs' => $match['inn2_overs'], 'balls' => $match['inn2_balls']];
    } else {
        $batted = ['runs' => $match['inn2_runs'], 'overs' => $match['inn2_overs'], 'balls' => $match['inn2_balls']];
        $bowled = ['runs' => $match['inn1_runs'], 'overs' => $match['inn1_overs'], 'balls' => $match['inn1_balls']];
    }
    
    $details[] = [
        'match_id' => $match['match_id'],
        'teams' => $match['team1_name'] . ' vs ' . $match['team2_name'],
        'winner' => $match['winner_id'] == $isuru_id ? 'Isuru Won' : 'Isuru Lost',
        'isuru_batting' => $batted,
        'isuru_bowling' => $bowled,
        'run_rate_for' => $batted['overs'] > 0 ? round($batted['runs'] / $batted['overs'], 2) : 0,
        'run_rate_against' => $bowled['overs'] > 0 ? round($bowled['runs'] / $bowled['overs'], 2) : 0,
    ];
}

// Get points table data
$stmt = $db->prepare("
    SELECT pt.*, t.team_name
    FROM points_table pt
    JOIN teams t ON pt.team_id = t.id
    WHERE t.team_name LIKE '%Isuru%'
");
$stmt->execute();
$points = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    'matches' => $details,
    'points_table' => $points,
    'nrr_explanation' => [
        'formula' => '(Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)',
        'calculation' => sprintf(
            '(%d / %.1f) - (%d / %.1f) = %.2f - %.2f = %.3f',
            $points['runs_scored'],
            $points['overs_faced'],
            $points['runs_conceded'],
            $points['overs_bowled'],
            $points['overs_faced'] > 0 ? $points['runs_scored'] / $points['overs_faced'] : 0,
            $points['overs_bowled'] > 0 ? $points['runs_conceded'] / $points['overs_bowled'] : 0,
            $points['nrr']
        )
    ]
], JSON_PRETTY_PRINT);
?>
