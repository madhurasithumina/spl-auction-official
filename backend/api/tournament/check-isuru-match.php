<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/database.php';

$db = Database::getInstance()->getConnection();

// Get Team Isuru's match details
$stmt = $db->prepare("
    SELECT m.id, m.team1_id, m.team2_id, m.winner_id, m.total_overs,
           t1.team_name as team1_name, t2.team_name as team2_name,
           i1.batting_team_id as inn1_batting, i1.total_runs as inn1_runs, 
           i1.total_overs as inn1_overs, i1.total_wickets as inn1_wickets,
           i2.batting_team_id as inn2_batting, i2.total_runs as inn2_runs, 
           i2.total_overs as inn2_overs, i2.total_wickets as inn2_wickets,
           ti.id as isuru_id
    FROM matches m
    JOIN teams t1 ON m.team1_id = t1.id
    JOIN teams t2 ON m.team2_id = t2.id
    JOIN innings i1 ON m.id = i1.match_id AND i1.innings_number = 1
    JOIN innings i2 ON m.id = i2.match_id AND i2.innings_number = 2
    JOIN teams ti ON ti.team_name LIKE '%Isuru%'
    WHERE (m.team1_id = ti.id OR m.team2_id = ti.id)
    AND m.status = 'completed'
");
$stmt->execute();
$match = $stmt->fetch(PDO::FETCH_ASSOC);

$isuru_id = $match['isuru_id'];
$isuru_batted_in_inn2 = ($match['inn2_batting'] == $isuru_id);
$isuru_won = ($match['winner_id'] == $isuru_id);

echo json_encode([
    'match_id' => $match['id'],
    'teams' => $match['team1_name'] . ' vs ' . $match['team2_name'],
    'total_overs_per_team' => $match['total_overs'],
    'innings_1' => [
        'batting_team_id' => $match['inn1_batting'],
        'runs' => $match['inn1_runs'],
        'overs' => $match['inn1_overs'],
        'wickets' => $match['inn1_wickets']
    ],
    'innings_2' => [
        'batting_team_id' => $match['inn2_batting'],
        'runs' => $match['inn2_runs'],
        'overs' => $match['inn2_overs'],
        'wickets' => $match['inn2_wickets']
    ],
    'isuru_id' => $isuru_id,
    'isuru_batted_second' => $isuru_batted_in_inn2,
    'isuru_won' => $isuru_won,
    'winner_id' => $match['winner_id'],
    'should_apply_full_overs_rule' => ($isuru_won && $isuru_batted_in_inn2 && $match['inn2_wickets'] < 10)
], JSON_PRETTY_PRINT);
?>
