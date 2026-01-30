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
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $inningsId = $data['innings_id'];
        $matchId = $data['match_id'];
        $batsmanId = $data['batsman_id'];
        $nonStrikerId = $data['non_striker_id'];
        $bowlerId = $data['bowler_id'];
        $runsScored = $data['runs_scored'] ?? 0;
        $isWide = $data['is_wide'] ?? false;
        $isNoball = $data['is_noball'] ?? false;
        $isBye = $data['is_bye'] ?? false;
        $isLegbye = $data['is_legbye'] ?? false;
        $isWicket = $data['is_wicket'] ?? false;
        $wicketType = $data['wicket_type'] ?? null;
        $wicketPlayerId = $data['wicket_player_id'] ?? null;
        $fielderId = $data['fielder_id'] ?? null;
        $isPenalty = $data['is_penalty'] ?? false;
        $penaltyRuns = $data['penalty_runs'] ?? 0;
        
        // Get current over and ball from match state
        $stmt = $db->prepare("SELECT * FROM match_state WHERE match_id = ?");
        $stmt->execute([$matchId]);
        $state = $stmt->fetch();
        
        $currentOver = $state['current_over'];
        $currentBall = $state['current_ball'];
        
        // Determine if this is a legal ball
        $isLegalBall = !$isWide && !$isNoball;
        
        // Calculate extra runs
        $extraRuns = 0;
        if ($isWide) {
            $extraRuns = 1 + $runsScored; // Wide + any runs scored
        } elseif ($isNoball) {
            $extraRuns = 1; // No ball penalty (runs scored count separately)
        }
        
        // Calculate total runs for this ball
        $totalRuns = $runsScored + $extraRuns + ($isPenalty ? $penaltyRuns : 0);
        
        // Determine if it's a boundary
        $isFour = !$isWide && !$isNoball && !$isBye && !$isLegbye && $runsScored === 4;
        $isSix = !$isWide && !$isNoball && !$isBye && !$isLegbye && $runsScored === 6;
        
        // Insert ball record
        $stmt = $db->prepare("
            INSERT INTO ball_by_ball (
                innings_id, over_number, ball_number, batsman_id, non_striker_id, bowler_id,
                runs_scored, is_wide, is_noball, is_bye, is_legbye, is_wicket, wicket_type,
                wicket_player_id, fielder_id, is_boundary_four, is_boundary_six, is_legal_ball,
                extra_runs, total_runs, is_penalty, penalty_runs
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $ballNumber = $isLegalBall ? $currentBall + 1 : $currentBall;
        
        $stmt->execute([
            $inningsId, $currentOver, $ballNumber, $batsmanId, $nonStrikerId, $bowlerId,
            $runsScored, $isWide ? 1 : 0, $isNoball ? 1 : 0, $isBye ? 1 : 0, $isLegbye ? 1 : 0,
            $isWicket ? 1 : 0, $wicketType, $wicketPlayerId, $fielderId,
            $isFour ? 1 : 0, $isSix ? 1 : 0, $isLegalBall ? 1 : 0,
            $extraRuns, $totalRuns, $isPenalty ? 1 : 0, $penaltyRuns
        ]);
        
        // Update batsman scorecard (only for runs scored by batsman, not extras)
        if (!$isWide && !$isBye && !$isLegbye) {
            $stmt = $db->prepare("
                UPDATE batsman_scorecard 
                SET runs_scored = runs_scored + ?,
                    balls_faced = balls_faced + ?,
                    fours = fours + ?,
                    sixes = sixes + ?,
                    strike_rate = ROUND((runs_scored + ?) / (balls_faced + ?) * 100, 2)
                WHERE innings_id = ? AND player_id = ?
            ");
            $ballsFaced = $isNoball ? 0 : 1; // No ball doesn't count as ball faced for batsman
            $stmt->execute([
                $runsScored,
                $ballsFaced,
                $isFour ? 1 : 0,
                $isSix ? 1 : 0,
                $runsScored,
                $ballsFaced,
                $inningsId,
                $batsmanId
            ]);
        }
        
        // Update bowler scorecard
        $bowlerRuns = $isWide || $isNoball ? $totalRuns : ($isBye || $isLegbye ? 0 : $runsScored);
        $stmt = $db->prepare("
            UPDATE bowler_scorecard 
            SET runs_conceded = runs_conceded + ?,
                balls_bowled = balls_bowled + ?,
                wickets = wickets + ?,
                wides = wides + ?,
                noballs = noballs + ?,
                dot_balls = dot_balls + ?,
                overs_bowled = FLOOR((balls_bowled + ?) / 6) + MOD(balls_bowled + ?, 6) / 10,
                economy = ROUND(runs_conceded / NULLIF(FLOOR((balls_bowled + ?) / 6) + MOD(balls_bowled + ?, 6) / 10, 0), 2)
            WHERE innings_id = ? AND player_id = ?
        ");
        
        $legalBallForBowler = $isLegalBall ? 1 : 0;
        $isDotBall = $isLegalBall && $totalRuns === 0 && !$isWicket;
        
        $stmt->execute([
            $bowlerRuns,
            $legalBallForBowler,
            $isWicket && $wicketType !== 'run_out' ? 1 : 0,
            $isWide ? 1 : 0,
            $isNoball ? 1 : 0,
            $isDotBall ? 1 : 0,
            $legalBallForBowler,
            $legalBallForBowler,
            $legalBallForBowler,
            $legalBallForBowler,
            $inningsId,
            $bowlerId
        ]);
        
        // Update partnership
        $stmt = $db->prepare("
            UPDATE partnerships 
            SET total_runs = total_runs + ?,
                total_balls = total_balls + ?,
                batsman1_runs = batsman1_runs + CASE WHEN batsman1_id = ? THEN ? ELSE 0 END,
                batsman2_runs = batsman2_runs + CASE WHEN batsman2_id = ? THEN ? ELSE 0 END
            WHERE innings_id = ? AND is_current = TRUE
        ");
        $partnershipBalls = $isLegalBall ? 1 : 0;
        $batsmanRuns = $isWide || $isBye || $isLegbye ? 0 : $runsScored;
        $stmt->execute([
            $totalRuns, 
            $partnershipBalls, 
            $batsmanId, $batsmanRuns, 
            $batsmanId, $batsmanRuns, 
            $inningsId
        ]);
        
        // Handle wicket
        if ($isWicket) {
            // Update dismissed batsman
            $stmt = $db->prepare("
                UPDATE batsman_scorecard 
                SET status = 'out', 
                    dismissal_type = ?,
                    dismissed_by = ?,
                    fielder_id = ?,
                    is_at_crease = FALSE,
                    is_on_strike = FALSE
                WHERE innings_id = ? AND player_id = ?
            ");
            $stmt->execute([$wicketType, $bowlerId, $fielderId, $inningsId, $wicketPlayerId ?? $batsmanId]);
            
            // Get current innings totals for fall of wicket
            $stmt = $db->prepare("SELECT total_runs, total_wickets, total_overs FROM innings WHERE id = ?");
            $stmt->execute([$inningsId]);
            $inningsTotals = $stmt->fetch();
            
            // Record fall of wicket
            $stmt = $db->prepare("
                INSERT INTO fall_of_wickets (innings_id, wicket_number, player_id, runs_at_fall, overs_at_fall)
                VALUES (?, ?, ?, ?, ?)
            ");
            $wicketNumber = $inningsTotals['total_wickets'] + 1;
            $stmt->execute([
                $inningsId, 
                $wicketNumber, 
                $wicketPlayerId ?? $batsmanId, 
                $inningsTotals['total_runs'] + $totalRuns,
                $currentOver + ($ballNumber / 10)
            ]);
            
            // End current partnership and create new one if not all out
            $stmt = $db->prepare("UPDATE partnerships SET is_current = FALSE WHERE innings_id = ? AND is_current = TRUE");
            $stmt->execute([$inningsId]);
        }
        
        // Update match state
        $newBall = $currentBall;
        $newOver = $currentOver;
        $needNewBowler = false;
        $runsThisOver = $state['runs_this_over'];
        
        if ($isLegalBall) {
            $newBall = $currentBall + 1;
            if ($newBall >= 6) {
                $newOver = $currentOver + 1;
                $newBall = 0;
                $needNewBowler = true;
                $runsThisOver = '';
            } else {
                $runsThisOver .= ($runsThisOver ? ',' : '') . ($isWicket ? 'W' : $totalRuns);
            }
        } else {
            // Extras notation
            $extraNotation = $isWide ? ($totalRuns . 'Wd') : ($totalRuns . 'Nb');
            $runsThisOver .= ($runsThisOver ? ',' : '') . $extraNotation;
        }
        
        // Determine strike rotation
        $newStrikerId = $batsmanId;
        $newNonStrikerId = $nonStrikerId;
        
        // Rotate strike on odd runs (including extras on wide/no-ball)
        $totalRunsForStrike = $totalRuns;
        if ($totalRunsForStrike % 2 === 1) {
            $newStrikerId = $nonStrikerId;
            $newNonStrikerId = $batsmanId;
        }
        
        // End of over rotation (if legal ball completed the over)
        if ($isLegalBall && $newBall === 0) {
            // Swap back since we already rotated
            $temp = $newStrikerId;
            $newStrikerId = $newNonStrikerId;
            $newNonStrikerId = $temp;
        }
        
        // If wicket, reset striker
        if ($isWicket) {
            if ($wicketPlayerId === $batsmanId || !$wicketPlayerId) {
                $newStrikerId = null; // Need new batsman
            } else {
                $newNonStrikerId = null; // Run out of non-striker
            }
        }
        
        $stmt = $db->prepare("
            UPDATE match_state 
            SET current_over = ?, current_ball = ?, striker_id = ?, non_striker_id = ?,
                runs_this_over = ?, need_new_bowler = ?, last_bowler_id = CASE WHEN ? THEN current_bowler_id ELSE last_bowler_id END,
                current_bowler_id = CASE WHEN ? THEN NULL ELSE current_bowler_id END
            WHERE match_id = ?
        ");
        $stmt->execute([
            $newOver, $newBall, $newStrikerId, $newNonStrikerId,
            $runsThisOver, $needNewBowler ? 1 : 0, $needNewBowler ? 1 : 0, $needNewBowler ? 1 : 0, $matchId
        ]);
        
        // Update batsman strike status
        if ($newStrikerId) {
            $stmt = $db->prepare("UPDATE batsman_scorecard SET is_on_strike = FALSE WHERE innings_id = ?");
            $stmt->execute([$inningsId]);
            $stmt = $db->prepare("UPDATE batsman_scorecard SET is_on_strike = TRUE WHERE innings_id = ? AND player_id = ?");
            $stmt->execute([$inningsId, $newStrikerId]);
        }
        
        // Update innings totals
        $stmt = $db->prepare("
            UPDATE innings 
            SET total_runs = total_runs + ?,
                total_wickets = total_wickets + ?,
                total_balls = total_balls + ?,
                total_overs = FLOOR((total_balls + ?) / 6) + MOD(total_balls + ?, 6) / 10,
                extras_wide = extras_wide + ?,
                extras_noball = extras_noball + ?,
                extras_bye = extras_bye + ?,
                extras_legbye = extras_legbye + ?,
                extras_penalty = extras_penalty + ?
            WHERE id = ?
        ");
        $stmt->execute([
            $totalRuns,
            $isWicket ? 1 : 0,
            $isLegalBall ? 1 : 0,
            $isLegalBall ? 1 : 0,
            $isLegalBall ? 1 : 0,
            $isWide ? $extraRuns : 0,
            $isNoball ? 1 + ($isNoball && !$isBye && !$isLegbye ? $runsScored : 0) : 0,
            $isBye ? $runsScored : 0,
            $isLegbye ? $runsScored : 0,
            $isPenalty ? $penaltyRuns : 0,
            $inningsId
        ]);
        
        // Get updated state
        $stmt = $db->prepare("SELECT * FROM match_state WHERE match_id = ?");
        $stmt->execute([$matchId]);
        $updatedState = $stmt->fetch();
        
        $stmt = $db->prepare("SELECT * FROM innings WHERE id = ?");
        $stmt->execute([$inningsId]);
        $updatedInnings = $stmt->fetch();
        
        // Get match details for total overs
        $stmt = $db->prepare("SELECT * FROM matches WHERE id = ?");
        $stmt->execute([$matchId]);
        $match = $stmt->fetch();
        
        // Check for auto-end conditions
        $shouldEndInnings = false;
        $endReason = '';
        $matchCompleted = false;
        $winnerId = null;
        $winMargin = '';
        
        // Check if all overs completed
        $totalBallsAllowed = $match['total_overs'] * 6;
        if ($updatedInnings['total_balls'] >= $totalBallsAllowed) {
            $shouldEndInnings = true;
            $endReason = 'All overs completed';
        }
        
        // Check if all wickets down (10 wickets)
        if ($updatedInnings['total_wickets'] >= 10) {
            $shouldEndInnings = true;
            $endReason = 'All out';
        }
        
        // Check for second innings specific conditions
        if ($updatedInnings['innings_number'] == 2 && $updatedInnings['target']) {
            // Check if target reached
            if ($updatedInnings['total_runs'] >= $updatedInnings['target']) {
                $shouldEndInnings = true;
                $matchCompleted = true;
                $winnerId = $updatedInnings['batting_team_id'];
                $wicketsRemaining = 10 - $updatedInnings['total_wickets'];
                $winMargin = "Won by $wicketsRemaining wickets";
                $endReason = 'Target reached';
            }
        }
        
        // Auto-end innings if conditions met
        if ($shouldEndInnings) {
            $stmt = $db->prepare("UPDATE innings SET status = 'completed' WHERE id = ?");
            $stmt->execute([$inningsId]);
            
            // If first innings ended, trigger innings break
            if ($updatedInnings['innings_number'] == 1) {
                $stmt = $db->prepare("UPDATE matches SET status = 'innings_break' WHERE id = ?");
                $stmt->execute([$matchId]);
                
                // Set target for second innings
                $firstInningsTotal = $updatedInnings['total_runs'];
                $stmt = $db->prepare("UPDATE innings SET target = ? WHERE match_id = ? AND innings_number = 2");
                $stmt->execute([$firstInningsTotal + 1, $matchId]);
            }
            
            // If second innings ended and match not already completed (all out or overs done before target)
            if ($updatedInnings['innings_number'] == 2 && !$matchCompleted) {
                $matchCompleted = true;
                
                // Get first innings score to determine winner
                $stmt = $db->prepare("SELECT * FROM innings WHERE match_id = ? AND innings_number = 1");
                $stmt->execute([$matchId]);
                $firstInnings = $stmt->fetch();
                
                if ($updatedInnings['total_runs'] < $updatedInnings['target']) {
                    // First team wins
                    $winnerId = $firstInnings['batting_team_id'];
                    $runsDifference = $updatedInnings['target'] - $updatedInnings['total_runs'] - 1;
                    $winMargin = "Won by $runsDifference runs";
                } else {
                    // Match tied (exactly same score but all out/overs done)
                    $winnerId = null;
                    $winMargin = 'Match tied';
                }
            }
        }
        
        // Complete match if needed
        if ($matchCompleted) {
            $stmt = $db->prepare("UPDATE matches SET status = 'completed', winner_id = ?, win_margin = ? WHERE id = ?");
            $stmt->execute([$winnerId, $winMargin, $matchId]);
            
            // Mark all innings as completed
            $stmt = $db->prepare("UPDATE innings SET status = 'completed' WHERE match_id = ?");
            $stmt->execute([$matchId]);
        }
        
        echo json_encode([
            'success' => true,
            'ball_recorded' => true,
            'match_state' => $updatedState,
            'innings' => $updatedInnings,
            'need_new_batsman' => $isWicket,
            'need_new_bowler' => $needNewBowler,
            'runs_this_ball' => $totalRuns,
            'is_legal_ball' => $isLegalBall,
            'innings_ended' => $shouldEndInnings,
            'innings_end_reason' => $endReason,
            'match_completed' => $matchCompleted,
            'winner_id' => $winnerId,
            'win_margin' => $winMargin
        ]);
        
    } elseif ($method === 'GET') {
        // Get ball-by-ball for an innings
        $inningsId = $_GET['innings_id'] ?? null;
        
        if ($inningsId) {
            $stmt = $db->prepare("
                SELECT bbb.*, 
                       bat.player_name as batsman_name,
                       ns.player_name as non_striker_name,
                       bowl.player_name as bowler_name,
                       wp.player_name as wicket_player_name,
                       fp.player_name as fielder_name
                FROM ball_by_ball bbb
                JOIN players bat ON bbb.batsman_id = bat.id
                JOIN players ns ON bbb.non_striker_id = ns.id
                JOIN players bowl ON bbb.bowler_id = bowl.id
                LEFT JOIN players wp ON bbb.wicket_player_id = wp.id
                LEFT JOIN players fp ON bbb.fielder_id = fp.id
                WHERE bbb.innings_id = ?
                ORDER BY bbb.over_number, bbb.id
            ");
            $stmt->execute([$inningsId]);
            echo json_encode($stmt->fetchAll());
        } else {
            echo json_encode(['error' => 'Innings ID required']);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
