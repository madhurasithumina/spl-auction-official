<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
            $inningsId = $_GET['innings_id'] ?? null;
            $matchId = $_GET['match_id'] ?? null;
            
            if ($inningsId) {
                // Get specific innings scorecard
                $stmt = $db->prepare("
                    SELECT i.*, 
                           bt.team_name as batting_team_name,
                           bwt.team_name as bowling_team_name
                    FROM innings i
                    JOIN teams bt ON i.batting_team_id = bt.id
                    JOIN teams bwt ON i.bowling_team_id = bwt.id
                    WHERE i.id = ?
                ");
                $stmt->execute([$inningsId]);
                $innings = $stmt->fetch();
                
                if ($innings) {
                    // Get batsman scorecard
                    $stmt = $db->prepare("
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
                    $stmt->execute([$inningsId]);
                    $innings['batsmen'] = $stmt->fetchAll();
                    
                    // Get bowler scorecard
                    $stmt = $db->prepare("
                        SELECT bws.*, p.player_name
                        FROM bowler_scorecard bws
                        JOIN players p ON bws.player_id = p.id
                        WHERE bws.innings_id = ?
                        ORDER BY bws.id
                    ");
                    $stmt->execute([$inningsId]);
                    $innings['bowlers'] = $stmt->fetchAll();
                    
                    // Get fall of wickets
                    $stmt = $db->prepare("
                        SELECT fow.*, p.player_name
                        FROM fall_of_wickets fow
                        JOIN players p ON fow.player_id = p.id
                        WHERE fow.innings_id = ?
                        ORDER BY fow.wicket_number
                    ");
                    $stmt->execute([$inningsId]);
                    $innings['fall_of_wickets'] = $stmt->fetchAll();
                    
                    // Get partnerships
                    $stmt = $db->prepare("
                        SELECT pa.*, 
                               p1.player_name as batsman1_name,
                               p2.player_name as batsman2_name
                        FROM partnerships pa
                        JOIN players p1 ON pa.batsman1_id = p1.id
                        JOIN players p2 ON pa.batsman2_id = p2.id
                        WHERE pa.innings_id = ?
                        ORDER BY pa.wicket_number
                    ");
                    $stmt->execute([$inningsId]);
                    $innings['partnerships'] = $stmt->fetchAll();
                    
                    echo json_encode($innings);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Innings not found']);
                }
            } elseif ($matchId) {
                // Get all innings for a match
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
                echo json_encode($stmt->fetchAll());
            } else {
                echo json_encode(['error' => 'Innings ID or Match ID required']);
            }
            break;
            
        case 'POST':
            // Initialize batsmen and bowlers for innings
            $data = json_decode(file_get_contents('php://input'), true);
            $inningsId = $data['innings_id'];
            $strikerId = $data['striker_id'];
            $nonStrikerId = $data['non_striker_id'];
            $bowlerId = $data['bowler_id'];
            $matchId = $data['match_id'];
            
            // Get innings info to know the batting team
            $stmt = $db->prepare("SELECT batting_team_id FROM innings WHERE id = ?");
            $stmt->execute([$inningsId]);
            $battingTeamId = $stmt->fetchColumn();
            
            // Check if batsman scorecard entries exist for this innings
            $stmt = $db->prepare("SELECT COUNT(*) FROM batsman_scorecard WHERE innings_id = ?");
            $stmt->execute([$inningsId]);
            $batsmenCount = $stmt->fetchColumn();
            
            // If no batsmen entries, create them from playing XI
            if ($batsmenCount == 0) {
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
                    ");
                    $insertStmt->execute([$inningsId, $player['player_id'], $position]);
                    $position++;
                }
            }
            
            // Set opening batsmen
            $stmt = $db->prepare("
                UPDATE batsman_scorecard 
                SET status = 'batting', is_on_strike = TRUE, is_at_crease = TRUE
                WHERE innings_id = ? AND player_id = ?
            ");
            $stmt->execute([$inningsId, $strikerId]);
            
            $stmt = $db->prepare("
                UPDATE batsman_scorecard 
                SET status = 'batting', is_on_strike = FALSE, is_at_crease = TRUE
                WHERE innings_id = ? AND player_id = ?
            ");
            $stmt->execute([$inningsId, $nonStrikerId]);
            
            // Create bowler scorecard entry
            $stmt = $db->prepare("
                INSERT INTO bowler_scorecard (innings_id, player_id, is_current_bowler)
                VALUES (?, ?, TRUE)
                ON DUPLICATE KEY UPDATE is_current_bowler = TRUE
            ");
            $stmt->execute([$inningsId, $bowlerId]);
            
            // Update match state
            $stmt = $db->prepare("
                UPDATE match_state 
                SET striker_id = ?, non_striker_id = ?, current_bowler_id = ?, current_over = 0, current_ball = 0
                WHERE match_id = ?
            ");
            $stmt->execute([$strikerId, $nonStrikerId, $bowlerId, $matchId]);
            
            // Create initial partnership
            $stmt = $db->prepare("
                INSERT INTO partnerships (innings_id, wicket_number, batsman1_id, batsman2_id, is_current)
                VALUES (?, 0, ?, ?, TRUE)
            ");
            $stmt->execute([$inningsId, $strikerId, $nonStrikerId]);
            
            echo json_encode(['success' => true, 'message' => 'Innings initialized']);
            break;
            
        case 'PUT':
            // Update innings totals (called after each ball)
            $data = json_decode(file_get_contents('php://input'), true);
            $inningsId = $data['innings_id'];
            
            // Recalculate totals from ball_by_ball
            $stmt = $db->prepare("
                SELECT 
                    COALESCE(SUM(total_runs), 0) as total_runs,
                    COALESCE(SUM(CASE WHEN is_wicket = 1 THEN 1 ELSE 0 END), 0) as total_wickets,
                    COALESCE(SUM(CASE WHEN is_legal_ball = 1 THEN 1 ELSE 0 END), 0) as total_balls,
                    COALESCE(SUM(CASE WHEN is_wide = 1 THEN extra_runs ELSE 0 END), 0) as extras_wide,
                    COALESCE(SUM(CASE WHEN is_noball = 1 THEN extra_runs ELSE 0 END), 0) as extras_noball,
                    COALESCE(SUM(CASE WHEN is_bye = 1 THEN runs_scored ELSE 0 END), 0) as extras_bye,
                    COALESCE(SUM(CASE WHEN is_legbye = 1 THEN runs_scored ELSE 0 END), 0) as extras_legbye,
                    COALESCE(SUM(CASE WHEN is_penalty = 1 THEN penalty_runs ELSE 0 END), 0) as extras_penalty
                FROM ball_by_ball
                WHERE innings_id = ?
            ");
            $stmt->execute([$inningsId]);
            $totals = $stmt->fetch();
            
            $overs = floor($totals['total_balls'] / 6) + ($totals['total_balls'] % 6) / 10;
            
            $stmt = $db->prepare("
                UPDATE innings 
                SET total_runs = ?, total_wickets = ?, total_balls = ?, total_overs = ?,
                    extras_wide = ?, extras_noball = ?, extras_bye = ?, extras_legbye = ?, extras_penalty = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $totals['total_runs'],
                $totals['total_wickets'],
                $totals['total_balls'],
                $overs,
                $totals['extras_wide'],
                $totals['extras_noball'],
                $totals['extras_bye'],
                $totals['extras_legbye'],
                $totals['extras_penalty'],
                $inningsId
            ]);
            
            echo json_encode(['success' => true, 'totals' => $totals]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
