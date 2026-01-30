<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $matchId = $_GET['match_id'] ?? null;
        
        if (!$matchId) {
            echo json_encode(['error' => 'Match ID required']);
            exit();
        }
        
        // Get match details
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
        
        if (!$match) {
            echo json_encode(['error' => 'Match not found']);
            exit();
        }
        
        // Get match state
        $stmt = $db->prepare("SELECT * FROM match_state WHERE match_id = ?");
        $stmt->execute([$matchId]);
        $match['state'] = $stmt->fetch();
        
        // Get playing XI for both teams
        $stmt = $db->prepare("
            SELECT mxi.*, p.player_name, p.batting_side, p.bowling_style
            FROM match_playing_xi mxi
            JOIN players p ON mxi.player_id = p.id
            WHERE mxi.match_id = ?
            ORDER BY mxi.team_id, mxi.batting_order
        ");
        $stmt->execute([$matchId]);
        $playingXI = $stmt->fetchAll();
        
        $match['team1_xi'] = [];
        $match['team2_xi'] = [];
        foreach ($playingXI as $player) {
            if ($player['team_id'] == $match['team1_id']) {
                $match['team1_xi'][$player['player_id']] = $player;
            } else {
                $match['team2_xi'][$player['player_id']] = $player;
            }
        }
        
        // Get both innings
        $stmt = $db->prepare("
            SELECT i.*, 
                   bt.team_name as batting_team_name,
                   bwt.team_name as bowling_team_name
            FROM innings i
            JOIN teams bt ON i.batting_team_id = bt.id
            JOIN teams bwt ON i.bowling_team_id = bwt.id
            WHERE i.match_id = ?
            ORDER BY i.innings_number
        ");
        $stmt->execute([$matchId]);
        $innings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process each innings separately to avoid reference issues
        $processedInnings = [];
        foreach ($innings as $innKey => $inn) {
            // Create a new array to avoid reference issues
            $currentInnings = [];
            foreach ($inn as $key => $value) {
                $currentInnings[$key] = $value;
            }
            // Get batsmen for this innings
            $batsmenStmt = $db->prepare("
                SELECT bs.*, p.player_name,
                       db.player_name as dismissed_by_name,
                       f.player_name as fielder_name
                FROM batsman_scorecard bs
                JOIN players p ON bs.player_id = p.id
                LEFT JOIN players db ON bs.dismissed_by = db.id
                LEFT JOIN players f ON bs.fielder_id = f.id
                WHERE bs.innings_id = ?
                ORDER BY bs.batting_position
            ");
            $batsmenStmt->execute([$currentInnings['id']]);
            $currentInnings['batsmen'] = $batsmenStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get bowlers for this innings
            $bowlersStmt = $db->prepare("
                SELECT bws.*, p.player_name
                FROM bowler_scorecard bws
                JOIN players p ON bws.player_id = p.id
                WHERE bws.innings_id = ?
                ORDER BY bws.id
            ");
            $bowlersStmt->execute([$currentInnings['id']]);
            $currentInnings['bowlers'] = $bowlersStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get fall of wickets
            $fowStmt = $db->prepare("
                SELECT fow.*, p.player_name
                FROM fall_of_wickets fow
                JOIN players p ON fow.player_id = p.id
                WHERE fow.innings_id = ?
                ORDER BY fow.wicket_number
            ");
            $fowStmt->execute([$currentInnings['id']]);
            $currentInnings['fall_of_wickets'] = $fowStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get current batsmen at crease
            $creaseStmt = $db->prepare("
                SELECT bs.*, p.player_name
                FROM batsman_scorecard bs
                JOIN players p ON bs.player_id = p.id
                WHERE bs.innings_id = ? AND bs.is_at_crease = TRUE
            ");
            $creaseStmt->execute([$currentInnings['id']]);
            $currentInnings['batsmen_at_crease'] = $creaseStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get current bowler
            $bowlerStmt = $db->prepare("
                SELECT bws.*, p.player_name
                FROM bowler_scorecard bws
                JOIN players p ON bws.player_id = p.id
                WHERE bws.innings_id = ? AND bws.is_current_bowler = TRUE
            ");
            $bowlerStmt->execute([$currentInnings['id']]);
            $currentInnings['current_bowler'] = $bowlerStmt->fetch(PDO::FETCH_ASSOC);
            
            // Calculate run rate
            if ($currentInnings['total_overs'] > 0) {
                $currentInnings['run_rate'] = round($currentInnings['total_runs'] / $currentInnings['total_overs'], 2);
            } else {
                $currentInnings['run_rate'] = 0;
            }
            
            // Calculate required run rate for 2nd innings
            if ($currentInnings['innings_number'] == 2 && $currentInnings['target'] && $currentInnings['status'] == 'in_progress') {
                $remainingRuns = $currentInnings['target'] - $currentInnings['total_runs'];
                $totalOvers = $match['total_overs'];
                $remainingOvers = $totalOvers - $currentInnings['total_overs'];
                if ($remainingOvers > 0) {
                    $currentInnings['required_run_rate'] = round($remainingRuns / $remainingOvers, 2);
                }
                $currentInnings['runs_needed'] = $remainingRuns;
                $currentInnings['balls_remaining'] = ($totalOvers * 6) - $currentInnings['total_balls'];
            }
            
            $processedInnings[] = $currentInnings;
        }
        
        $match['innings'] = $processedInnings;
        
        // Determine current innings
        $match['current_innings_data'] = null;
        foreach ($processedInnings as $inn) {
            if ($inn['status'] === 'in_progress') {
                $match['current_innings_data'] = $inn;
                break;
            }
        }
        
        // Get recent balls (last 12)
        if ($match['current_innings_data']) {
            $stmt = $db->prepare("
                SELECT bbb.*, 
                       bat.player_name as batsman_name,
                       bowl.player_name as bowler_name
                FROM ball_by_ball bbb
                JOIN players bat ON bbb.batsman_id = bat.id
                JOIN players bowl ON bbb.bowler_id = bowl.id
                WHERE bbb.innings_id = ?
                ORDER BY bbb.id DESC
                LIMIT 12
            ");
            $stmt->execute([$match['current_innings_data']['id']]);
            $match['recent_balls'] = array_reverse($stmt->fetchAll());
        }
        
        echo json_encode($match);
        
    } elseif ($method === 'POST') {
        // Actions: set_batsman, set_bowler
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'];
        $matchId = $data['match_id'];
        $inningsId = $data['innings_id'];
        
        switch ($action) {
            case 'set_batsman':
                $playerId = $data['player_id'];
                $isStriker = $data['is_striker'] ?? true;
                
                // Update batsman status
                $stmt = $db->prepare("
                    UPDATE batsman_scorecard 
                    SET status = 'batting', is_at_crease = TRUE, is_on_strike = ?
                    WHERE innings_id = ? AND player_id = ?
                ");
                $stmt->execute([$isStriker ? 1 : 0, $inningsId, $playerId]);
                
                // Update match state
                if ($isStriker) {
                    $stmt = $db->prepare("UPDATE match_state SET striker_id = ? WHERE match_id = ?");
                } else {
                    $stmt = $db->prepare("UPDATE match_state SET non_striker_id = ? WHERE match_id = ?");
                }
                $stmt->execute([$playerId, $matchId]);
                
                // Create new partnership if we have both batsmen
                $stmt = $db->prepare("SELECT striker_id, non_striker_id FROM match_state WHERE match_id = ?");
                $stmt->execute([$matchId]);
                $state = $stmt->fetch();
                
                if ($state['striker_id'] && $state['non_striker_id']) {
                    // Get current wicket count
                    $stmt = $db->prepare("SELECT total_wickets FROM innings WHERE id = ?");
                    $stmt->execute([$inningsId]);
                    $wickets = $stmt->fetchColumn();
                    
                    $stmt = $db->prepare("
                        INSERT INTO partnerships (innings_id, wicket_number, batsman1_id, batsman2_id, is_current)
                        VALUES (?, ?, ?, ?, TRUE)
                    ");
                    $stmt->execute([$inningsId, $wickets, $state['striker_id'], $state['non_striker_id']]);
                }
                
                echo json_encode(['success' => true, 'message' => 'Batsman set']);
                break;
                
            case 'set_bowler':
                $playerId = $data['player_id'];
                
                // Reset current bowler flag
                $stmt = $db->prepare("UPDATE bowler_scorecard SET is_current_bowler = FALSE WHERE innings_id = ?");
                $stmt->execute([$inningsId]);
                
                // Create or update bowler entry
                $stmt = $db->prepare("
                    INSERT INTO bowler_scorecard (innings_id, player_id, is_current_bowler)
                    VALUES (?, ?, TRUE)
                    ON DUPLICATE KEY UPDATE is_current_bowler = TRUE
                ");
                $stmt->execute([$inningsId, $playerId]);
                
                // Update match state
                $stmt = $db->prepare("
                    UPDATE match_state 
                    SET current_bowler_id = ?, need_new_bowler = FALSE, runs_this_over = ''
                    WHERE match_id = ?
                ");
                $stmt->execute([$playerId, $matchId]);
                
                echo json_encode(['success' => true, 'message' => 'Bowler set']);
                break;
                
            case 'undo_ball':
                // Get the last ball
                $stmt = $db->prepare("
                    SELECT * FROM ball_by_ball 
                    WHERE innings_id = ? 
                    ORDER BY id DESC 
                    LIMIT 1
                ");
                $stmt->execute([$inningsId]);
                $lastBall = $stmt->fetch();
                
                if ($lastBall) {
                    // Reverse batsman stats
                    if (!$lastBall['is_wide'] && !$lastBall['is_bye'] && !$lastBall['is_legbye']) {
                        $stmt = $db->prepare("
                            UPDATE batsman_scorecard 
                            SET runs_scored = runs_scored - ?,
                                balls_faced = balls_faced - ?,
                                fours = fours - ?,
                                sixes = sixes - ?
                            WHERE innings_id = ? AND player_id = ?
                        ");
                        $stmt->execute([
                            $lastBall['runs_scored'],
                            $lastBall['is_legal_ball'] ? 1 : 0,
                            $lastBall['is_boundary_four'] ? 1 : 0,
                            $lastBall['is_boundary_six'] ? 1 : 0,
                            $inningsId,
                            $lastBall['batsman_id']
                        ]);
                    }
                    
                    // Reverse bowler stats
                    $stmt = $db->prepare("
                        UPDATE bowler_scorecard 
                        SET runs_conceded = runs_conceded - ?,
                            balls_bowled = balls_bowled - ?,
                            wickets = wickets - ?
                        WHERE innings_id = ? AND player_id = ?
                    ");
                    $stmt->execute([
                        $lastBall['total_runs'],
                        $lastBall['is_legal_ball'] ? 1 : 0,
                        ($lastBall['is_wicket'] && $lastBall['wicket_type'] !== 'run_out') ? 1 : 0,
                        $inningsId,
                        $lastBall['bowler_id']
                    ]);
                    
                    // Reverse innings totals
                    $stmt = $db->prepare("
                        UPDATE innings 
                        SET total_runs = total_runs - ?,
                            total_wickets = total_wickets - ?,
                            total_balls = total_balls - ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $lastBall['total_runs'],
                        $lastBall['is_wicket'] ? 1 : 0,
                        $lastBall['is_legal_ball'] ? 1 : 0,
                        $inningsId
                    ]);
                    
                    // Delete the ball
                    $stmt = $db->prepare("DELETE FROM ball_by_ball WHERE id = ?");
                    $stmt->execute([$lastBall['id']]);
                    
                    echo json_encode(['success' => true, 'message' => 'Ball undone']);
                } else {
                    echo json_encode(['error' => 'No balls to undo']);
                }
                break;
                
            default:
                echo json_encode(['error' => 'Unknown action']);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
