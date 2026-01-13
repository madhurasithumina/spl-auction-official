<?php
require_once __DIR__ . '/../config/database.php';

class Team {
    private $db;
    private $table = 'teams';
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    // Initialize teams
    public function initialize() {
        $teamNames = ['Software', 'Marketing', 'Technical', 'Accounts'];
        
        foreach ($teamNames as $name) {
            $query = "INSERT INTO {$this->table} (team_name, initial_budget, remaining_budget) 
                     VALUES (:team_name, 10000.00, 10000.00)
                     ON DUPLICATE KEY UPDATE team_name = team_name";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':team_name', $name);
            $stmt->execute();
        }
        
        return $this->getAll();
    }
    
    // Get all teams with player counts
    public function getAll() {
        $query = "SELECT t.*, 
                         COUNT(p.id) as player_count,
                         GROUP_CONCAT(p.id) as player_ids
                  FROM {$this->table} t
                  LEFT JOIN players p ON t.team_name = p.sold_team AND p.sold_status = 'Sold'
                  GROUP BY t.id
                  ORDER BY t.team_name";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $teams = $stmt->fetchAll();
        
        // Get players for each team
        foreach ($teams as &$team) {
            if ($team['player_ids']) {
                $team['players'] = $this->getTeamPlayers($team['team_name']);
            } else {
                $team['players'] = [];
            }
            unset($team['player_ids']);
        }
        
        return $teams;
    }
    
    // Get team by name
    public function getByName($teamName) {
        $query = "SELECT * FROM {$this->table} WHERE team_name = :team_name";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':team_name', $teamName);
        $stmt->execute();
        $team = $stmt->fetch();
        
        if ($team) {
            $team['players'] = $this->getTeamPlayers($teamName);
        }
        
        return $team;
    }
    
    // Get team players
    private function getTeamPlayers($teamName) {
        $query = "SELECT * FROM players 
                  WHERE sold_team = :team_name AND sold_status = 'Sold'
                  ORDER BY player_role DESC, player_name";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':team_name', $teamName);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Update team budget
    public function updateBudget($teamName, $amount) {
        $query = "UPDATE {$this->table} 
                  SET remaining_budget = remaining_budget - :amount 
                  WHERE team_name = :team_name";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':team_name', $teamName);
        
        return $stmt->execute();
    }
    
    // Reset team budget
    public function resetBudget($teamName) {
        $query = "UPDATE {$this->table} 
                  SET remaining_budget = initial_budget 
                  WHERE team_name = :team_name";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':team_name', $teamName);
        
        return $stmt->execute();
    }
    
    // Reset all teams
    public function resetAll() {
        // Reset all player assignments
        $playerQuery = "UPDATE players SET sold_status = 'Available', sold_team = '', sold_value = 0, player_role = ''";
        $this->db->exec($playerQuery);
        
        // Reset team budgets
        $query = "UPDATE {$this->table} SET remaining_budget = initial_budget";
        $this->db->exec($query);
        
        return $this->getAll();
    }
}
?>
