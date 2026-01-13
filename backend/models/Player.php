<?php
require_once __DIR__ . '/../config/database.php';

class Player {
    private $db;
    private $table = 'players';
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    // Create a new player
    public function create($data) {
        $query = "INSERT INTO {$this->table} 
                  (player_name, batting_side, age, bowling_side, bowling_style) 
                  VALUES (:player_name, :batting_side, :age, :bowling_side, :bowling_style)";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(':player_name', $data['playerName']);
        $stmt->bindParam(':batting_side', $data['battingSide']);
        $stmt->bindParam(':age', $data['age'], PDO::PARAM_INT);
        $stmt->bindParam(':bowling_side', $data['bowlingSide']);
        $stmt->bindParam(':bowling_style', $data['bowlingStyle']);
        
        if ($stmt->execute()) {
            return $this->getById($this->db->lastInsertId());
        }
        return false;
    }
    
    // Get all players
    public function getAll() {
        $query = "SELECT * FROM {$this->table} ORDER BY registered_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Get player by ID
    public function getById($id) {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }
    
    // Update player
    public function update($id, $data) {
        $fields = [];
        $params = [':id' => $id];
        
        foreach ($data as $key => $value) {
            $field = $this->camelToSnake($key);
            $fields[] = "{$field} = :{$key}";
            $params[":{$key}"] = $value;
        }
        
        $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);
        
        return $stmt->execute($params);
    }
    
    // Delete all players
    public function deleteAll() {
        $countQuery = "SELECT COUNT(*) as count FROM {$this->table}";
        $countStmt = $this->db->prepare($countQuery);
        $countStmt->execute();
        $count = $countStmt->fetch()['count'];
        
        $query = "DELETE FROM {$this->table}";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        // Reset auto increment
        $resetQuery = "ALTER TABLE {$this->table} AUTO_INCREMENT = 1";
        $this->db->exec($resetQuery);
        
        return $count;
    }
    
    // Helper function to convert camelCase to snake_case
    private function camelToSnake($input) {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
?>
