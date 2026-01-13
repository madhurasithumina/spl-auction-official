-- SPL Auction MySQL Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS spl_auction CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE spl_auction;

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    batting_side ENUM('RHB', 'LHB') NOT NULL,
    age INT NOT NULL CHECK (age >= 10 AND age <= 60),
    bowling_side ENUM('RHB', 'LHB') NOT NULL,
    bowling_style ENUM('Fast Bowling', 'Medium Fast', 'Off Spin', 'Leg Spin') NOT NULL,
    sold_status ENUM('Sold', 'Unsold', 'Available') DEFAULT 'Available',
    sold_value DECIMAL(10, 2) DEFAULT 0.00,
    sold_team ENUM('Software', 'Marketing', 'Technical', 'Accounts', '') DEFAULT '',
    player_role ENUM('Captain', 'Manager', 'Regular', '') DEFAULT '',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sold_status (sold_status),
    INDEX idx_sold_team (sold_team),
    INDEX idx_registered_at (registered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_name ENUM('Software', 'Marketing', 'Technical', 'Accounts') NOT NULL UNIQUE,
    initial_budget DECIMAL(10, 2) DEFAULT 10000.00,
    remaining_budget DECIMAL(10, 2) DEFAULT 10000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_team_name (team_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default teams
INSERT INTO teams (team_name, initial_budget, remaining_budget) VALUES
('Software', 10000.00, 10000.00),
('Marketing', 10000.00, 10000.00),
('Technical', 10000.00, 10000.00),
('Accounts', 10000.00, 10000.00)
ON DUPLICATE KEY UPDATE 
    team_name = VALUES(team_name);
