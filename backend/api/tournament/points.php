<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

class TournamentController {
    private $conn;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Get Points Table with NRR calculation
     */
    public function getPointsTable($tournament_id = 1) {
        try {
            $query = "SELECT * FROM v_points_table WHERE tournament_id = ? ORDER BY points DESC, nrr DESC, matches_won DESC, team_name ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$tournament_id]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $standings = [];
            $position = 1;
            
            foreach ($rows as $row) {
                $standings[] = [
                    'position' => $position++,
                    'team_id' => $row['team_id'],
                    'team_name' => $row['team_name'],
                    'matches_played' => (int)$row['matches_played'],
                    'matches_won' => (int)$row['matches_won'],
                    'matches_lost' => (int)$row['matches_lost'],
                    'matches_tied' => (int)$row['matches_tied'],
                    'matches_nr' => (int)$row['matches_nr'],
                    'points' => (int)$row['points'],
                    'nrr' => number_format((float)$row['nrr'], 3),
                    'runs_scored' => (int)$row['runs_scored'],
                    'runs_conceded' => (int)$row['runs_conceded'],
                    'overs_faced' => number_format((float)$row['overs_faced'], 1),
                    'overs_bowled' => number_format((float)$row['overs_bowled'], 1),
                    'run_rate_for' => number_format((float)$row['run_rate_for'], 2),
                    'run_rate_against' => number_format((float)$row['run_rate_against'], 2)
                ];
            }
            
            // Update positions in database
            foreach ($standings as $standing) {
                $update_query = "UPDATE points_table SET position = ? WHERE tournament_id = ? AND team_id = ?";
                $update_stmt = $this->conn->prepare($update_query);
                $update_stmt->execute([$standing['position'], $tournament_id, $standing['team_id']]);
            }
            
            return [
                'success' => true,
                'data' => $standings
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error fetching points table: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update points table after match completion
     */
    public function updatePointsTable($match_id) {
        try {
            $this->conn->beginTransaction();
            
            // Get match details
            $match_query = "SELECT m.*, ms.tournament_id, ms.stage,
                           i1.batting_team_id as inn1_team, i1.total_runs as inn1_runs, i1.total_overs as inn1_overs, i1.total_wickets as inn1_wickets,
                           i2.batting_team_id as inn2_team, i2.total_runs as inn2_runs, i2.total_overs as inn2_overs, i2.total_wickets as inn2_wickets
                           FROM matches m
                           LEFT JOIN match_stages ms ON m.id = ms.match_id
                           LEFT JOIN innings i1 ON m.id = i1.match_id AND i1.innings_number = 1
                           LEFT JOIN innings i2 ON m.id = i2.match_id AND i2.innings_number = 2
                           WHERE m.id = ? AND m.status = 'completed'";
            
            $stmt = $this->conn->prepare($match_query);
            $stmt->execute([$match_id]);
            $match = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$match) {
                throw new Exception("Match not found or not completed");
            }
            
            // Check if innings data exists
            if ($match['inn1_runs'] === null || $match['inn2_runs'] === null) {
                throw new Exception("Match innings data is incomplete");
            }
            
            // Default to tournament_id 1 and group_stage if match_stages record doesn't exist
            $tournament_id = $match['tournament_id'] ?? 1;
            $stage = $match['stage'] ?? 'group_stage';
            
            // Only update points for league stage matches
            if ($stage !== 'group_stage' && $stage !== null) {
                return [
                    'success' => true,
                    'message' => 'Playoff match - points table not updated'
                ];
            }
            
            // Check if this match has already been processed to prevent duplicate updates
            $check_processed = "SELECT COUNT(*) as count FROM team_match_stats WHERE match_id = ?";
            $check_stmt = $this->conn->prepare($check_processed);
            $check_stmt->execute([$match_id]);
            $processed = $check_stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($processed['count'] > 0) {
                return [
                    'success' => true,
                    'message' => 'Points table already updated for this match'
                ];
            }
            
            // Calculate stats for both teams
            // For NRR calculation: if a team wins by wickets (chasing), use full overs quota
            $total_overs = $match['total_overs'];
            
            // Determine which team batted in which innings
            $team1_batted_first = ($match['inn1_team'] == $match['team1_id']);
            
            if ($team1_batted_first) {
                // Team 1 batted in innings 1, Team 2 batted in innings 2
                $team1_runs = $match['inn1_runs'];
                $team1_overs = $match['inn1_overs'];
                $team1_wickets = $match['inn1_wickets'];
                $team2_runs = $match['inn2_runs'];
                $team2_overs = $match['inn2_overs'];
                $team2_wickets = $match['inn2_wickets'];
                
                // Apply full overs rule if team2 won by chasing with wickets in hand
                $team1_overs_faced = $team1_overs;
                $team2_overs_faced = $team2_overs;
                if ($match['winner_id'] == $match['team2_id'] && $team2_wickets < 10) {
                    $team2_overs_faced = $total_overs;
                }
            } else {
                // Team 2 batted in innings 1, Team 1 batted in innings 2
                $team1_runs = $match['inn2_runs'];
                $team1_overs = $match['inn2_overs'];
                $team1_wickets = $match['inn2_wickets'];
                $team2_runs = $match['inn1_runs'];
                $team2_overs = $match['inn1_overs'];
                $team2_wickets = $match['inn1_wickets'];
                
                // Apply full overs rule if team1 won by chasing with wickets in hand
                $team1_overs_faced = $team1_overs;
                $team2_overs_faced = $team2_overs;
                if ($match['winner_id'] == $match['team1_id'] && $team1_wickets < 10) {
                    $team1_overs_faced = $total_overs;
                }
            }
            
            $teams_stats = [
                [
                    'team_id' => $match['team1_id'],
                    'runs_scored' => $team1_runs,
                    'overs_faced' => $team1_overs_faced,
                    'wickets_lost' => $team1_wickets,
                    'runs_conceded' => $team2_runs,
                    'overs_bowled' => $team2_overs,
                    'wickets_taken' => $team2_wickets,
                    'is_winner' => ($match['winner_id'] == $match['team1_id'])
                ],
                [
                    'team_id' => $match['team2_id'],
                    'runs_scored' => $team2_runs,
                    'overs_faced' => $team2_overs_faced,
                    'wickets_lost' => $team2_wickets,
                    'runs_conceded' => $team1_runs,
                    'overs_bowled' => $team1_overs,
                    'wickets_taken' => $team1_wickets,
                    'is_winner' => ($match['winner_id'] == $match['team2_id'])
                ]
            ];
            
            foreach ($teams_stats as $team_stat) {
                // Update team match stats
                $stats_query = "INSERT INTO team_match_stats 
                               (match_id, tournament_id, team_id, runs_scored, wickets_lost, overs_faced, 
                                runs_conceded, wickets_taken, overs_bowled, is_winner, result_type)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                               ON DUPLICATE KEY UPDATE 
                                runs_scored = VALUES(runs_scored),
                                wickets_lost = VALUES(wickets_lost),
                                overs_faced = VALUES(overs_faced),
                                runs_conceded = VALUES(runs_conceded),
                                wickets_taken = VALUES(wickets_taken),
                                overs_bowled = VALUES(overs_bowled),
                                is_winner = VALUES(is_winner),
                                result_type = VALUES(result_type)";
                
                $result_type = $team_stat['is_winner'] ? 'win' : 'loss';
                if ($match['winner_id'] === null) {
                    $result_type = 'tie';
                }
                
                $stmt = $this->conn->prepare($stats_query);
                $success = $stmt->execute([
                    $match_id, 
                    $tournament_id, 
                    $team_stat['team_id'],
                    $team_stat['runs_scored'],
                    $team_stat['wickets_lost'],
                    $team_stat['overs_faced'],
                    $team_stat['runs_conceded'],
                    $team_stat['wickets_taken'],
                    $team_stat['overs_bowled'],
                    $team_stat['is_winner'],
                    $result_type
                ]);
                
                if (!$success) {
                    $error = $stmt->errorInfo();
                    error_log("team_match_stats INSERT failed: " . json_encode($error));
                    throw new Exception("Failed to insert team match stats: " . $error[2]);
                }
                $check_query = "SELECT id FROM points_table WHERE tournament_id = ? AND team_id = ?";
                $check_stmt = $this->conn->prepare($check_query);
                $check_stmt->execute([$tournament_id, $team_stat['team_id']]);
                $exists = $check_stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$exists) {
                    // Insert new points_table record if it doesn't exist
                    $insert_query = "INSERT INTO points_table (tournament_id, team_id, matches_played, matches_won, matches_lost, matches_tied, matches_nr, points, runs_scored, overs_faced, runs_conceded, overs_bowled, nrr) 
                                    VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)";
                    $insert_stmt = $this->conn->prepare($insert_query);
                    $insert_stmt->execute([$tournament_id, $team_stat['team_id']]);
                }
                
                // Update points table
                $points_query = "UPDATE points_table pt
                                SET matches_played = matches_played + 1,
                                    matches_won = matches_won + ?,
                                    matches_lost = matches_lost + ?,
                                    matches_tied = matches_tied + ?,
                                    points = points + ?,
                                    runs_scored = runs_scored + ?,
                                    overs_faced = overs_faced + ?,
                                    runs_conceded = runs_conceded + ?,
                                    overs_bowled = overs_bowled + ?
                                WHERE tournament_id = ? AND team_id = ?";
                
                $won = $team_stat['is_winner'] ? 1 : 0;
                $lost = (!$team_stat['is_winner'] && $match['winner_id'] !== null) ? 1 : 0;
                $tied = ($match['winner_id'] === null) ? 1 : 0;
                $points = $won * 2 + $tied * 1;
                
                $stmt = $this->conn->prepare($points_query);
                $stmt->execute([
                    $won, $lost, $tied, $points,
                    $team_stat['runs_scored'],
                    $team_stat['overs_faced'],
                    $team_stat['runs_conceded'],
                    $team_stat['overs_bowled'],
                    $tournament_id,
                    $team_stat['team_id']
                ]);
            }
            
            // Calculate and update NRR for all teams
            $this->calculateNRR($tournament_id);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Points table updated successfully'
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error updating points table: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Calculate NRR (Net Run Rate) for all teams
     * NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
     */
    private function calculateNRR($tournament_id) {
        $query = "SELECT team_id, runs_scored, overs_faced, runs_conceded, overs_bowled 
                 FROM points_table 
                 WHERE tournament_id = ? AND matches_played > 0";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$tournament_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($rows as $row) {
            $run_rate_for = ($row['overs_faced'] > 0) ? $row['runs_scored'] / $row['overs_faced'] : 0;
            $run_rate_against = ($row['overs_bowled'] > 0) ? $row['runs_conceded'] / $row['overs_bowled'] : 0;
            $nrr = $run_rate_for - $run_rate_against;
            
            $update_query = "UPDATE points_table SET nrr = ? WHERE tournament_id = ? AND team_id = ?";
            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->execute([$nrr, $tournament_id, $row['team_id']]);
        }
    }
    
    /**
     * Get playoff bracket and qualification status
     */
    public function getPlayoffBracket($tournament_id = 1) {
        try {
            // Get top 4 teams from points table
            $query = "SELECT * FROM v_points_table 
                     WHERE tournament_id = ? 
                     ORDER BY points DESC, nrr DESC, matches_won DESC 
                     LIMIT 4";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$tournament_id]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $qualified_teams = [];
            foreach ($rows as $row) {
                $qualified_teams[] = [
                    'position' => (int)$row['position'],
                    'team_id' => (int)$row['team_id'],
                    'team_name' => $row['team_name'],
                    'points' => (int)$row['points'],
                    'nrr' => number_format((float)$row['nrr'], 3),
                    'matches_won' => (int)$row['matches_won']
                ];
            }
            
            // Get playoff bracket if exists
            $bracket_query = "SELECT pb.*, 
                             t1.team_name as q1_team1_name, t2.team_name as q1_team2_name,
                             t3.team_name as e_team1_name, t4.team_name as e_team2_name,
                             t5.team_name as q2_team1_name, t6.team_name as q2_team2_name,
                             t7.team_name as f_team1_name, t8.team_name as f_team2_name,
                             tc.team_name as champion_name, tr.team_name as runner_up_name
                             FROM playoff_bracket pb
                             LEFT JOIN teams t1 ON pb.qualifier_1_team1_id = t1.id
                             LEFT JOIN teams t2 ON pb.qualifier_1_team2_id = t2.id
                             LEFT JOIN teams t3 ON pb.eliminator_team1_id = t3.id
                             LEFT JOIN teams t4 ON pb.eliminator_team2_id = t4.id
                             LEFT JOIN teams t5 ON pb.qualifier_2_team1_id = t5.id
                             LEFT JOIN teams t6 ON pb.qualifier_2_team2_id = t6.id
                             LEFT JOIN teams t7 ON pb.final_team1_id = t7.id
                             LEFT JOIN teams t8 ON pb.final_team2_id = t8.id
                             LEFT JOIN teams tc ON pb.champion_team_id = tc.id
                             LEFT JOIN teams tr ON pb.runner_up_team_id = tr.id
                             WHERE pb.tournament_id = ?";
            
            $stmt = $this->conn->prepare($bracket_query);
            $stmt->execute([$tournament_id]);
            $bracket = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'data' => [
                    'qualified_teams' => $qualified_teams,
                    'bracket' => $bracket
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error fetching playoff bracket: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Initialize playoff matches
     */
    public function initializePlayoffs($tournament_id = 1) {
        try {
            $this->conn->beginTransaction();
            
            // Get top 4 teams
            $query = "SELECT team_id, team_name, position FROM v_points_table 
                     WHERE tournament_id = ? 
                     ORDER BY points DESC, nrr DESC, matches_won DESC 
                     LIMIT 4";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$tournament_id]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $teams = [];
            foreach ($rows as $row) {
                $teams[$row['position']] = $row;
            }
            
            if (count($teams) < 4) {
                throw new Exception("Not enough teams qualified for playoffs");
            }
            
            // Create or update playoff bracket
            $bracket_query = "INSERT INTO playoff_bracket 
                             (tournament_id, qualifier_1_team1_id, qualifier_1_team2_id, 
                              eliminator_team1_id, eliminator_team2_id)
                             VALUES (?, ?, ?, ?, ?)
                             ON DUPLICATE KEY UPDATE
                             qualifier_1_team1_id = VALUES(qualifier_1_team1_id),
                             qualifier_1_team2_id = VALUES(qualifier_1_team2_id),
                             eliminator_team1_id = VALUES(eliminator_team1_id),
                             eliminator_team2_id = VALUES(eliminator_team2_id)";
            
            $stmt = $this->conn->prepare($bracket_query);
            $stmt->execute([
                $tournament_id,
                $teams[1]['team_id'], // 1st place
                $teams[2]['team_id'], // 2nd place
                $teams[3]['team_id'], // 3rd place
                $teams[4]['team_id']  // 4th place
            ]);
            
            // Update tournament status
            $update_query = "UPDATE tournaments SET status = 'playoffs', current_stage = 'qualifier_1' WHERE id = ?";
            $stmt = $this->conn->prepare($update_query);
            $stmt->execute([$tournament_id]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Playoffs initialized successfully',
                'data' => [
                    'qualifier_1' => [
                        'team1' => $teams[1],
                        'team2' => $teams[2]
                    ],
                    'eliminator' => [
                        'team1' => $teams[3],
                        'team2' => $teams[4]
                    ]
                ]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error initializing playoffs: ' . $e->getMessage()
            ];
        }
    }
}

// Handle API requests
$database = Database::getInstance();
$db = $database->getConnection();
$controller = new TournamentController($db);

$method = $_SERVER['REQUEST_METHOD'];
// Support PATH_INFO and fallback to query parameter ?path=...
$path = $_SERVER['PATH_INFO'] ?? '/';
if ($path === '/' && isset($_GET['path'])) {
    $path = '/' . trim($_GET['path'], '/');
}

switch ($method) {
    case 'GET':
        if ($path === '/points-table' || $path === '/') {
            $tournament_id = $_GET['tournament_id'] ?? 1;
            echo json_encode($controller->getPointsTable($tournament_id));
        } elseif ($path === '/playoff-bracket') {
            $tournament_id = $_GET['tournament_id'] ?? 1;
            echo json_encode($controller->getPlayoffBracket($tournament_id));
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if ($path === '/update-points') {
            $match_id = $data['match_id'] ?? null;
            if ($match_id) {
                echo json_encode($controller->updatePointsTable($match_id));
            } else {
                echo json_encode(['success' => false, 'message' => 'Match ID required']);
            }
        } elseif ($path === '/initialize-playoffs') {
            $tournament_id = $data['tournament_id'] ?? 1;
            echo json_encode($controller->initializePlayoffs($tournament_id));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
