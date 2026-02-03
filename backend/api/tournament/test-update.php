<?php
// Simple test script to manually update points for a match
require_once __DIR__ . '/../../config/database.php';

// Get database connection
$db = Database::getInstance();
$conn = $db->getConnection();

// Test with match ID 17
$match_id = 17;

echo "Testing database connection...\n";
echo "Connected: " . ($conn ? "Yes" : "No") . "\n\n";

// Check the completed match
echo "Checking match $match_id:\n";
$query = "SELECT m.*, ms.stage FROM matches m 
          LEFT JOIN match_stages ms ON m.id = ms.match_id 
          WHERE m.id = ?";
$stmt = $conn->prepare($query);
$stmt->execute([$match_id]);
$match = $stmt->fetch(PDO::FETCH_ASSOC);
echo "Match found: " . ($match ? "Yes" : "No") . "\n";
echo "Status: " . ($match ? $match['status'] : 'N/A') . "\n";
echo "Winner ID: " . ($match ? $match['winner_id'] : 'N/A') . "\n";
echo "Stage: " . ($match ? ($match['stage'] ?? 'NULL') : 'N/A') . "\n\n";

// Check innings data
echo "Checking innings data for match $match_id:\n";
$query = "SELECT * FROM innings WHERE match_id = ?";
$stmt = $conn->prepare($query);
$stmt->execute([$match_id]);
$innings = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Innings records found: " . count($innings) . "\n";
foreach ($innings as $inning) {
    echo "  Team {$inning['batting_team_id']}: {$inning['total_runs']}/{$inning['total_wickets']} in {$inning['total_overs']} overs\n";
}
echo "\n";

// Check team_match_stats
echo "Checking team_match_stats for match $match_id:\n";
$query = "SELECT * FROM team_match_stats WHERE match_id = ?";
$stmt = $conn->prepare($query);
$stmt->execute([$match_id]);
$stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Stats records found: " . count($stats) . "\n";
print_r($stats);
echo "\n";

// Check points table current state
echo "Current Points Table:\n";
$query = "SELECT team_id, matches_played, matches_won, matches_lost, points, nrr FROM points_table WHERE tournament_id = 1";
$stmt = $conn->prepare($query);
$stmt->execute();
$points = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($points);
?>
