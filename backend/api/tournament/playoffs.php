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

class PlayoffController {
    private $conn;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Create Qualifier 1 Match (1st vs 2nd)
     */
    public function createQualifier1($tournament_id = 1, $match_date, $venue) {
        try {
            $this->conn->beginTransaction();
            
            // Get playoff bracket
            $bracket_query = "SELECT * FROM playoff_bracket WHERE tournament_id = ?";
            $stmt = $this->conn->prepare($bracket_query);
            $stmt->execute([$tournament_id]);
            $bracket = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$bracket || !$bracket['qualifier_1_team1_id'] || !$bracket['qualifier_1_team2_id']) {
                throw new Exception("Playoff bracket not initialized");
            }
            
            // Create match
            $match_query = "INSERT INTO matches (match_date, team1_id, team2_id, venue, status, toss_winner_id, toss_choice, total_overs)
                           VALUES (?, ?, ?, ?, 'setup', ?, 'bat', 20)";
            
            $stmt = $this->conn->prepare($match_query);
            $stmt->execute([
                $match_date,
                $bracket['qualifier_1_team1_id'],
                $bracket['qualifier_1_team2_id'],
                $venue,
                $bracket['qualifier_1_team1_id']
            ]);
            $match_id = $this->conn->lastInsertId();
            
            // Create match stage entry
            $stage_query = "INSERT INTO match_stages (match_id, tournament_id, stage, match_number, is_knockout, qualifier_position)
                           VALUES (?, ?, 'qualifier_1', 1, TRUE, 'Q1: 1st vs 2nd')";
            
            $stmt = $this->conn->prepare($stage_query);
            $stmt->execute([$match_id, $tournament_id]);
            
            // Update bracket with match ID
            $update_query = "UPDATE playoff_bracket SET qualifier_1_match_id = ? WHERE tournament_id = ?";
            $stmt = $this->conn->prepare($update_query);
            $stmt->execute([$match_id, $tournament_id]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Qualifier 1 match created successfully',
                'data' => ['match_id' => $match_id]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error creating Qualifier 1: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Create Eliminator Match (3rd vs 4th)
     */
    public function createEliminator($tournament_id = 1, $match_date, $venue) {
        try {
            $this->conn->beginTransaction();
            
            // Get playoff bracket
            $bracket_query = "SELECT * FROM playoff_bracket WHERE tournament_id = ?";
            $stmt = $this->conn->prepare($bracket_query);
            $stmt->execute([$tournament_id]);
            $bracket = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$bracket || !$bracket['eliminator_team1_id'] || !$bracket['eliminator_team2_id']) {
                throw new Exception("Playoff bracket not initialized");
            }
            
            // Create match
            $match_query = "INSERT INTO matches (match_date, team1_id, team2_id, venue, status, toss_winner_id, toss_choice, total_overs)
                           VALUES (?, ?, ?, ?, 'setup', ?, 'bat', 20)";
            
            $stmt = $this->conn->prepare($match_query);
            $stmt->execute([
                $match_date,
                $bracket['eliminator_team1_id'],
                $bracket['eliminator_team2_id'],
                $venue,
                $bracket['eliminator_team1_id']
            ]);
            $match_id = $this->conn->lastInsertId();
            
            // Create match stage entry
            $stage_query = "INSERT INTO match_stages (match_id, tournament_id, stage, match_number, is_knockout, qualifier_position)
                           VALUES (?, ?, 'eliminator', 2, TRUE, 'Eliminator: 3rd vs 4th')";
            
            $stmt = $this->conn->prepare($stage_query);
            $stmt->execute([$match_id, $tournament_id]);
            
            // Update bracket
            $update_query = "UPDATE playoff_bracket SET eliminator_match_id = ? WHERE tournament_id = ?";
            $stmt = $this->conn->prepare($update_query);
            $stmt->execute([$match_id, $tournament_id]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Eliminator match created successfully',
                'data' => ['match_id' => $match_id]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error creating Eliminator: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update Qualifier 1 result and prepare for Qualifier 2
     */
    public function updateQualifier1Result($tournament_id = 1, $match_id, $winner_id) {
        try {
            $this->conn->beginTransaction();
            
            // Get match details
            $match_query = "SELECT team1_id, team2_id FROM matches WHERE id = ?";
            $stmt = $this->conn->prepare($match_query);
            $stmt->execute([$match_id]);
            $match = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $loser_id = ($match['team1_id'] == $winner_id) ? $match['team2_id'] : $match['team1_id'];
            
            // Update playoff bracket
            $update_query = "UPDATE playoff_bracket 
                           SET qualifier_1_winner_id = ?,
                               final_team1_id = ?,
                               qualifier_2_team1_id = ?
                           WHERE tournament_id = ?";
            
            $stmt = $this->conn->prepare($update_query);
            $stmt->execute([$winner_id, $winner_id, $loser_id, $tournament_id]);
            
            // Update tournament stage
            $stage_query = "UPDATE tournaments SET current_stage = 'eliminator' WHERE id = ?";
            $stmt = $this->conn->prepare($stage_query);
            $stmt->execute([$tournament_id]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Qualifier 1 result updated. Winner advances to Final.',
                'data' => [
                    'final_team_1' => $winner_id,
                    'qualifier_2_team_1' => $loser_id
                ]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error updating Qualifier 1 result: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update Eliminator result and create Qualifier 2
     */
    public function updateEliminatorResult($tournament_id = 1, $match_id, $winner_id) {
        try {
            $this->conn->beginTransaction();
            
            // Update playoff bracket with eliminator winner
            $update_query = "UPDATE playoff_bracket 
                           SET eliminator_winner_id = ?,
                               qualifier_2_team2_id = ?
                           WHERE tournament_id = ?";
            
            $stmt = $this->conn->prepare($update_query);
            $stmt->execute([$winner_id, $winner_id, $tournament_id]);
            
            // Update tournament stage
            $stage_query = "UPDATE tournaments SET current_stage = 'qualifier_2' WHERE id = ?";
            $stmt = $this->conn->prepare($stage_query);
            $stmt->execute([$tournament_id]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Eliminator result updated. Winner advances to Qualifier 2.',
                'data' => [
                    'qualifier_2_team_2' => $winner_id
                ]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error updating Eliminator result: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Create Qualifier 2 Match (Loser of Q1 vs Winner of Eliminator)
     */
    public function createQualifier2($tournament_id = 1, $match_date, $venue) {
        try {
            $this->conn->beginTransaction();
            
            // Get playoff bracket
            $bracket_query = "SELECT * FROM playoff_bracket WHERE tournament_id = ?";
            $stmt = $this->conn->prepare($bracket_query);
            $stmt->execute([$tournament_id]);
            $bracket = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$bracket || !$bracket['qualifier_2_team1_id'] || !$bracket['qualifier_2_team2_id']) {
                throw new Exception("Qualifier 2 teams not set");
            }
            
            // Create match
            $match_query = "INSERT INTO matches (match_date, team1_id, team2_id, venue, status, toss_winner_id, toss_choice, total_overs)
                           VALUES (?, ?, ?, ?, 'setup', ?, 'bat', 20)";
            
            $stmt = $this->conn->prepare($match_query);
            $stmt->execute([
                $match_date,
                $bracket['qualifier_2_team1_id'],
                $bracket['qualifier_2_team2_id'],
                $venue,
                $bracket['qualifier_2_team1_id']
            ]);
            $match_id = $this->conn->lastInsertId();
            
            // Create match stage entry
            $stage_query = "INSERT INTO match_stages (match_id, tournament_id, stage, match_number, is_knockout, qualifier_position)
                           VALUES (?, ?, 'qualifier_2', 3, TRUE, 'Q2: Loser Q1 vs Winner Eliminator')";
            
            $stmt = $this->conn->prepare($stage_query);
            $stmt->execute([$match_id, $tournament_id]);
            
            // Update bracket
            $update_query = "UPDATE playoff_bracket SET qualifier_2_match_id = ? WHERE tournament_id = ?";
            $stmt = $this->conn->prepare($update_query);
            $stmt->execute([$match_id, $tournament_id]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Qualifier 2 match created successfully',
                'data' => ['match_id' => $match_id]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error creating Qualifier 2: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update Qualifier 2 result and prepare for Final
     */
    public function updateQualifier2Result($tournament_id = 1, $match_id, $winner_id) {
        try {
            $this->conn->beginTransaction();
            
            // Update playoff bracket
            $update_query = "UPDATE playoff_bracket 
                           SET qualifier_2_winner_id = ?,
                               final_team2_id = ?
                           WHERE tournament_id = ?";
            
            $stmt = $this->conn->prepare($update_query);
            $stmt->execute([$winner_id, $winner_id, $tournament_id]);
            
            // Update tournament stage
            $stage_query = "UPDATE tournaments SET current_stage = 'final' WHERE id = ?";
            $stmt = $this->conn->prepare($stage_query);
            $stmt->execute([$tournament_id]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Qualifier 2 result updated. Both finalists are set.',
                'data' => [
                    'final_team_2' => $winner_id
                ]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error updating Qualifier 2 result: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Create Final Match
     */
    public function createFinal($tournament_id = 1, $match_date, $venue) {
        try {
            $this->conn->beginTransaction();
            
            // Get playoff bracket
            $bracket_query = "SELECT * FROM playoff_bracket WHERE tournament_id = ?";
            $stmt = $this->conn->prepare($bracket_query);
            $stmt->execute([$tournament_id]);
            $bracket = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$bracket || !$bracket['final_team1_id'] || !$bracket['final_team2_id']) {
                throw new Exception("Final teams not set");
            }
            
            // Create match
            $match_query = "INSERT INTO matches (match_date, team1_id, team2_id, venue, status, toss_winner_id, toss_choice, total_overs)
                           VALUES (?, ?, ?, ?, 'setup', ?, 'bat', 20)";
            
            $stmt = $this->conn->prepare($match_query);
            $stmt->execute([
                $match_date,
                $bracket['final_team1_id'],
                $bracket['final_team2_id'],
                $venue,
                $bracket['final_team1_id']
            ]);
            $match_id = $this->conn->lastInsertId();
            
            // Create match stage entry
            $stage_query = "INSERT INTO match_stages (match_id, tournament_id, stage, match_number, is_knockout, qualifier_position)
                           VALUES (?, ?, 'final', 4, TRUE, 'FINAL')";
            
            $stmt = $this->conn->prepare($stage_query);
            $stmt->execute([$match_id, $tournament_id]);
            
            // Update bracket
            $update_query = "UPDATE playoff_bracket SET final_match_id = ? WHERE tournament_id = ?";
            $stmt = $this->conn->prepare($update_query);
            $stmt->execute([$match_id, $tournament_id]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Final match created successfully',
                'data' => ['match_id' => $match_id]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error creating Final: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Update Final result and declare champion
     */
    public function updateFinalResult($tournament_id = 1, $match_id, $winner_id) {
        try {
            $this->conn->beginTransaction();
            
            // Get match details
            $match_query = "SELECT team1_id, team2_id FROM matches WHERE id = ?";
            $stmt = $this->conn->prepare($match_query);
            $stmt->execute([$match_id]);
            $match = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $runner_up_id = ($match['team1_id'] == $winner_id) ? $match['team2_id'] : $match['team1_id'];
            
            // Update playoff bracket with champion
            $update_query = "UPDATE playoff_bracket 
                           SET final_winner_id = ?,
                               champion_team_id = ?,
                               runner_up_team_id = ?
                           WHERE tournament_id = ?";
            
            $stmt = $this->conn->prepare($update_query);
            $stmt->execute([$winner_id, $winner_id, $runner_up_id, $tournament_id]);
            
            // Update tournament status to completed
            $stage_query = "UPDATE tournaments SET status = 'completed', end_date = CURDATE() WHERE id = ?";
            $stmt = $this->conn->prepare($stage_query);
            $stmt->execute([$tournament_id]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Tournament completed! Champion declared.',
                'data' => [
                    'champion' => $winner_id,
                    'runner_up' => $runner_up_id
                ]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error updating Final result: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get tournament progression status
     */
    public function getTournamentStatus($tournament_id = 1) {
        try {
            $query = "SELECT t.*, pb.*,
                     t1.team_name as q1_team1, t2.team_name as q1_team2, tw1.team_name as q1_winner,
                     t3.team_name as e_team1, t4.team_name as e_team2, tw2.team_name as e_winner,
                     t5.team_name as q2_team1, t6.team_name as q2_team2, tw3.team_name as q2_winner,
                     t7.team_name as f_team1, t8.team_name as f_team2,
                     tc.team_name as champion, tr.team_name as runner_up
                     FROM tournaments t
                     LEFT JOIN playoff_bracket pb ON t.id = pb.tournament_id
                     LEFT JOIN teams t1 ON pb.qualifier_1_team1_id = t1.id
                     LEFT JOIN teams t2 ON pb.qualifier_1_team2_id = t2.id
                     LEFT JOIN teams tw1 ON pb.qualifier_1_winner_id = tw1.id
                     LEFT JOIN teams t3 ON pb.eliminator_team1_id = t3.id
                     LEFT JOIN teams t4 ON pb.eliminator_team2_id = t4.id
                     LEFT JOIN teams tw2 ON pb.eliminator_winner_id = tw2.id
                     LEFT JOIN teams t5 ON pb.qualifier_2_team1_id = t5.id
                     LEFT JOIN teams t6 ON pb.qualifier_2_team2_id = t6.id
                     LEFT JOIN teams tw3 ON pb.qualifier_2_winner_id = tw3.id
                     LEFT JOIN teams t7 ON pb.final_team1_id = t7.id
                     LEFT JOIN teams t8 ON pb.final_team2_id = t8.id
                     LEFT JOIN teams tc ON pb.champion_team_id = tc.id
                     LEFT JOIN teams tr ON pb.runner_up_team_id = tr.id
                     WHERE t.id = ?";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$tournament_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'data' => $result
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error fetching tournament status: ' . $e->getMessage()
            ];
        }
    }
}

// Handle API requests
$database = Database::getInstance();
$db = $database->getConnection();
$controller = new PlayoffController($db);

$method = $_SERVER['REQUEST_METHOD'];
// Support PATH_INFO and fallback to query parameter ?path=...
$path = $_SERVER['PATH_INFO'] ?? '/';
if ($path === '/' && isset($_GET['path'])) {
    $path = '/' . trim($_GET['path'], '/');
}

switch ($method) {
    case 'GET':
        if ($path === '/status' || $path === '/') {
            $tournament_id = $_GET['tournament_id'] ?? 1;
            echo json_encode($controller->getTournamentStatus($tournament_id));
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $tournament_id = $data['tournament_id'] ?? 1;
        
        switch ($path) {
            case '/create-qualifier-1':
                echo json_encode($controller->createQualifier1(
                    $tournament_id,
                    $data['match_date'],
                    $data['venue'] ?? 'SPL Stadium'
                ));
                break;
                
            case '/create-eliminator':
                echo json_encode($controller->createEliminator(
                    $tournament_id,
                    $data['match_date'],
                    $data['venue'] ?? 'SPL Stadium'
                ));
                break;
                
            case '/create-qualifier-2':
                echo json_encode($controller->createQualifier2(
                    $tournament_id,
                    $data['match_date'],
                    $data['venue'] ?? 'SPL Stadium'
                ));
                break;
                
            case '/create-final':
                echo json_encode($controller->createFinal(
                    $tournament_id,
                    $data['match_date'],
                    $data['venue'] ?? 'SPL Stadium'
                ));
                break;
                
            case '/update-qualifier-1':
                echo json_encode($controller->updateQualifier1Result(
                    $tournament_id,
                    $data['match_id'],
                    $data['winner_id']
                ));
                break;
                
            case '/update-eliminator':
                echo json_encode($controller->updateEliminatorResult(
                    $tournament_id,
                    $data['match_id'],
                    $data['winner_id']
                ));
                break;
                
            case '/update-qualifier-2':
                echo json_encode($controller->updateQualifier2Result(
                    $tournament_id,
                    $data['match_id'],
                    $data['winner_id']
                ));
                break;
                
            case '/update-final':
                echo json_encode($controller->updateFinalResult(
                    $tournament_id,
                    $data['match_id'],
                    $data['winner_id']
                ));
                break;
                
            default:
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
                break;
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
