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
            if (isset($_GET['id'])) {
                // Get single match with details
                $matchId = $_GET['id'];
                $stmt = $db->prepare("
                    SELECT m.*, 
                           t1.team_name as team1_name,
                           t2.team_name as team2_name,
                           tw.team_name as toss_winner_name,
                           w.team_name as winner_name
                    FROM matches m
                    JOIN teams t1 ON m.team1_id = t1.id
                    JOIN teams t2 ON m.team2_id = t2.id
                    JOIN teams tw ON m.toss_winner_id = tw.id
                    LEFT JOIN teams w ON m.winner_id = w.id
                    WHERE m.id = ?
                ");
                $stmt->execute([$matchId]);
                $match = $stmt->fetch();
                
                if ($match) {
                    // Get playing XI for both teams
                    $stmt = $db->prepare("
                        SELECT mxi.*, p.player_name, p.batting_style, p.bowling_style, p.photo_url
                        FROM match_playing_xi mxi
                        JOIN players p ON mxi.player_id = p.id
                        WHERE mxi.match_id = ?
                        ORDER BY mxi.team_id, mxi.batting_order
                    ");
                    $stmt->execute([$matchId]);
                    $playingXI = $stmt->fetchAll();
                    
                    $match['team1_xi'] = array_filter($playingXI, fn($p) => $p['team_id'] == $match['team1_id']);
                    $match['team2_xi'] = array_filter($playingXI, fn($p) => $p['team_id'] == $match['team2_id']);
                    
                    // Get innings data
                    $stmt = $db->prepare("SELECT * FROM innings WHERE match_id = ? ORDER BY innings_number");
                    $stmt->execute([$matchId]);
                    $match['innings'] = $stmt->fetchAll();
                    
                    // Get match state
                    $stmt = $db->prepare("SELECT * FROM match_state WHERE match_id = ?");
                    $stmt->execute([$matchId]);
                    $match['state'] = $stmt->fetch();
                    
                    echo json_encode($match);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Match not found']);
                }
            } else {
                // Get all matches
                $stmt = $db->query("
                    SELECT m.*, 
                           t1.team_name as team1_name,
                           t2.team_name as team2_name,
                           tw.team_name as toss_winner_name,
                           w.team_name as winner_name
                    FROM matches m
                    JOIN teams t1 ON m.team1_id = t1.id
                    JOIN teams t2 ON m.team2_id = t2.id
                    JOIN teams tw ON m.toss_winner_id = tw.id
                    LEFT JOIN teams w ON m.winner_id = w.id
                    ORDER BY m.created_at DESC
                ");
                echo json_encode($stmt->fetchAll());
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Create new match
            $stmt = $db->prepare("
                INSERT INTO matches (match_date, team1_id, team2_id, total_overs, toss_winner_id, toss_choice, venue, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'setup')
            ");
            $stmt->execute([
                $data['match_date'] ?? date('Y-m-d'),
                $data['team1_id'],
                $data['team2_id'],
                $data['total_overs'] ?? 20,
                $data['toss_winner_id'],
                $data['toss_choice'],
                $data['venue'] ?? 'SPL Stadium'
            ]);
            
            $matchId = $db->lastInsertId();
            
            // Create innings records
            $battingFirst = $data['toss_choice'] === 'bat' ? $data['toss_winner_id'] : 
                            ($data['toss_winner_id'] == $data['team1_id'] ? $data['team2_id'] : $data['team1_id']);
            $bowlingFirst = $battingFirst == $data['team1_id'] ? $data['team2_id'] : $data['team1_id'];
            
            // First innings
            $stmt = $db->prepare("
                INSERT INTO innings (match_id, innings_number, batting_team_id, bowling_team_id, status)
                VALUES (?, 1, ?, ?, 'not_started')
            ");
            $stmt->execute([$matchId, $battingFirst, $bowlingFirst]);
            
            // Second innings
            $stmt = $db->prepare("
                INSERT INTO innings (match_id, innings_number, batting_team_id, bowling_team_id, status)
                VALUES (?, 2, ?, ?, 'not_started')
            ");
            $stmt->execute([$matchId, $bowlingFirst, $battingFirst]);
            
            // Create match state
            $stmt = $db->prepare("INSERT INTO match_state (match_id) VALUES (?)");
            $stmt->execute([$matchId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Match created successfully',
                'match_id' => $matchId
            ]);
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $matchId = $data['match_id'];
            
            if (isset($data['action'])) {
                switch ($data['action']) {
                    case 'start_match':
                        // Start the match
                        $stmt = $db->prepare("UPDATE matches SET status = 'live', current_innings = 1 WHERE id = ?");
                        $stmt->execute([$matchId]);
                        
                        // Start first innings
                        $stmt = $db->prepare("UPDATE innings SET status = 'in_progress' WHERE match_id = ? AND innings_number = 1");
                        $stmt->execute([$matchId]);
                        
                        // Get first innings ID
                        $stmt = $db->prepare("SELECT id FROM innings WHERE match_id = ? AND innings_number = 1");
                        $stmt->execute([$matchId]);
                        $inningsId = $stmt->fetchColumn();
                        
                        // Update match state
                        $stmt = $db->prepare("UPDATE match_state SET current_innings_id = ? WHERE match_id = ?");
                        $stmt->execute([$inningsId, $matchId]);
                        
                        echo json_encode(['success' => true, 'message' => 'Match started']);
                        break;
                        
                    case 'innings_break':
                        // End first innings, start break
                        $stmt = $db->prepare("UPDATE matches SET status = 'innings_break' WHERE id = ?");
                        $stmt->execute([$matchId]);
                        
                        // Complete first innings
                        $stmt = $db->prepare("UPDATE innings SET status = 'completed' WHERE match_id = ? AND innings_number = 1");
                        $stmt->execute([$matchId]);
                        
                        // Get first innings total for target
                        $stmt = $db->prepare("SELECT total_runs FROM innings WHERE match_id = ? AND innings_number = 1");
                        $stmt->execute([$matchId]);
                        $firstInningsTotal = $stmt->fetchColumn();
                        
                        // Set target for second innings
                        $stmt = $db->prepare("UPDATE innings SET target = ? WHERE match_id = ? AND innings_number = 2");
                        $stmt->execute([$firstInningsTotal + 1, $matchId]);
                        
                        echo json_encode(['success' => true, 'message' => 'Innings break', 'target' => $firstInningsTotal + 1]);
                        break;
                        
                    case 'start_second_innings':
                        $stmt = $db->prepare("UPDATE matches SET status = 'live', current_innings = 2 WHERE id = ?");
                        $stmt->execute([$matchId]);
                        
                        $stmt = $db->prepare("UPDATE innings SET status = 'in_progress' WHERE match_id = ? AND innings_number = 2");
                        $stmt->execute([$matchId]);
                        
                        // Get second innings ID and batting team
                        $stmt = $db->prepare("SELECT id, batting_team_id FROM innings WHERE match_id = ? AND innings_number = 2");
                        $stmt->execute([$matchId]);
                        $inningsData = $stmt->fetch();
                        $inningsId = $inningsData['id'];
                        $battingTeamId = $inningsData['batting_team_id'];
                        
                        // Create batsman scorecard entries for batting team's playing XI
                        $stmt = $db->prepare("
                            SELECT player_id, batting_order FROM match_playing_xi 
                            WHERE match_id = ? AND team_id = ?
                            ORDER BY batting_order
                        ");
                        $stmt->execute([$matchId, $battingTeamId]);
                        $battingXI = $stmt->fetchAll();
                        
                        $position = 1;
                        foreach ($battingXI as $player) {
                            $insertStmt = $db->prepare("
                                INSERT INTO batsman_scorecard (innings_id, player_id, batting_position, status)
                                VALUES (?, ?, ?, 'yet_to_bat')
                                ON DUPLICATE KEY UPDATE batting_position = VALUES(batting_position)
                            ");
                            $insertStmt->execute([$inningsId, $player['player_id'], $position]);
                            $position++;
                        }
                        
                        // Update match state - reset everything for new innings
                        $stmt = $db->prepare("
                            UPDATE match_state 
                            SET current_innings_id = ?, striker_id = NULL, non_striker_id = NULL, 
                                current_bowler_id = NULL, last_bowler_id = NULL, current_over = 0, 
                                current_ball = 0, runs_this_over = '', need_new_bowler = 0
                            WHERE match_id = ?
                        ");
                        $stmt->execute([$inningsId, $matchId]);
                        
                        echo json_encode(['success' => true, 'message' => 'Second innings started']);
                        break;
                        
                    case 'end_match':
                        $stmt = $db->prepare("
                            UPDATE matches 
                            SET status = 'completed', winner_id = ?, win_margin = ?
                            WHERE id = ?
                        ");
                        $stmt->execute([$data['winner_id'], $data['win_margin'], $matchId]);
                        
                        $stmt = $db->prepare("UPDATE innings SET status = 'completed' WHERE match_id = ?");
                        $stmt->execute([$matchId]);
                        
                        echo json_encode(['success' => true, 'message' => 'Match completed']);
                        break;
                        
                    default:
                        echo json_encode(['error' => 'Unknown action']);
                }
            }
            break;
            
        case 'DELETE':
            $matchId = $_GET['id'] ?? null;
            if ($matchId) {
                $stmt = $db->prepare("DELETE FROM matches WHERE id = ?");
                $stmt->execute([$matchId]);
                echo json_encode(['success' => true, 'message' => 'Match deleted']);
            } else {
                echo json_encode(['error' => 'Match ID required']);
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
