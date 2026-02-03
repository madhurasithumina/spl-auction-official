-- Tournament System Schema
-- Professional Cricket League Tournament Management with NRR

USE spl_auction;

-- Tournament Table
CREATE TABLE IF NOT EXISTS tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_name VARCHAR(255) NOT NULL,
    season VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    status ENUM('upcoming', 'league_stage', 'playoffs', 'completed') DEFAULT 'upcoming',
    current_stage ENUM('group_stage', 'qualifier_1', 'eliminator', 'qualifier_2', 'final') DEFAULT 'group_stage',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_season (season)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Points Table
CREATE TABLE IF NOT EXISTS points_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    team_id INT NOT NULL,
    matches_played INT DEFAULT 0,
    matches_won INT DEFAULT 0,
    matches_lost INT DEFAULT 0,
    matches_tied INT DEFAULT 0,
    matches_nr INT DEFAULT 0,
    points INT DEFAULT 0,
    runs_scored INT DEFAULT 0,
    overs_faced DECIMAL(6,1) DEFAULT 0.0,
    runs_conceded INT DEFAULT 0,
    overs_bowled DECIMAL(6,1) DEFAULT 0.0,
    nrr DECIMAL(6,3) DEFAULT 0.000,
    position INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_tournament (tournament_id, team_id),
    INDEX idx_points (points DESC),
    INDEX idx_nrr (nrr DESC),
    INDEX idx_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Match Stages Table (to track league vs playoff matches)
CREATE TABLE IF NOT EXISTS match_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL UNIQUE,
    tournament_id INT NOT NULL,
    stage ENUM('group_stage', 'qualifier_1', 'eliminator', 'qualifier_2', 'final') DEFAULT 'group_stage',
    match_number INT NOT NULL,
    is_knockout BOOLEAN DEFAULT FALSE,
    qualifier_position VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    INDEX idx_stage (stage),
    INDEX idx_tournament (tournament_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team Statistics (for detailed NRR tracking)
CREATE TABLE IF NOT EXISTS team_match_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    tournament_id INT NOT NULL,
    team_id INT NOT NULL,
    runs_scored INT DEFAULT 0,
    wickets_lost INT DEFAULT 0,
    overs_faced DECIMAL(6,1) DEFAULT 0.0,
    balls_faced INT DEFAULT 0,
    runs_conceded INT DEFAULT 0,
    wickets_taken INT DEFAULT 0,
    overs_bowled DECIMAL(6,1) DEFAULT 0.0,
    balls_bowled INT DEFAULT 0,
    is_winner BOOLEAN DEFAULT FALSE,
    result_type ENUM('win', 'loss', 'tie', 'no_result') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_match (match_id, team_id),
    INDEX idx_tournament_team (tournament_id, team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Playoff Bracket (for tracking tournament progression)
CREATE TABLE IF NOT EXISTS playoff_bracket (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    qualifier_1_team1_id INT DEFAULT NULL,
    qualifier_1_team2_id INT DEFAULT NULL,
    qualifier_1_winner_id INT DEFAULT NULL,
    qualifier_1_match_id INT DEFAULT NULL,
    eliminator_team1_id INT DEFAULT NULL,
    eliminator_team2_id INT DEFAULT NULL,
    eliminator_winner_id INT DEFAULT NULL,
    eliminator_match_id INT DEFAULT NULL,
    qualifier_2_team1_id INT DEFAULT NULL,
    qualifier_2_team2_id INT DEFAULT NULL,
    qualifier_2_winner_id INT DEFAULT NULL,
    qualifier_2_match_id INT DEFAULT NULL,
    final_team1_id INT DEFAULT NULL,
    final_team2_id INT DEFAULT NULL,
    final_winner_id INT DEFAULT NULL,
    final_match_id INT DEFAULT NULL,
    champion_team_id INT DEFAULT NULL,
    runner_up_team_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tournament_bracket (tournament_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize default tournament
INSERT INTO tournaments (tournament_name, season, start_date, status) 
VALUES ('SPL Championship', '2026', '2026-02-01', 'league_stage')
ON DUPLICATE KEY UPDATE status = status;

-- Initialize points table for all teams
INSERT INTO points_table (tournament_id, team_id)
SELECT 1, id FROM teams
ON DUPLICATE KEY UPDATE team_id = team_id;

-- Views for easy querying

-- Points Table View with Team Names
CREATE OR REPLACE VIEW v_points_table AS
SELECT 
    pt.id,
    pt.tournament_id,
    t.tournament_name,
    pt.team_id,
    tm.team_name,
    pt.matches_played,
    pt.matches_won,
    pt.matches_lost,
    pt.matches_tied,
    pt.matches_nr,
    pt.points,
    pt.nrr,
    pt.position,
    pt.runs_scored,
    pt.overs_faced,
    pt.runs_conceded,
    pt.overs_bowled,
    -- Calculate run rate
    CASE 
        WHEN pt.overs_faced > 0 THEN pt.runs_scored / pt.overs_faced
        ELSE 0.00
    END as run_rate_for,
    CASE 
        WHEN pt.overs_bowled > 0 THEN pt.runs_conceded / pt.overs_bowled
        ELSE 0.00
    END as run_rate_against
FROM points_table pt
INNER JOIN teams tm ON pt.team_id = tm.id
INNER JOIN tournaments t ON pt.tournament_id = t.id
ORDER BY pt.points DESC, pt.nrr DESC, pt.matches_won DESC;

-- Match Results View
CREATE OR REPLACE VIEW v_match_results AS
SELECT 
    m.id as match_id,
    m.match_date,
    m.venue,
    m.status,
    ms.stage,
    ms.match_number,
    ms.is_knockout,
    t1.team_name as team1,
    t2.team_name as team2,
    tw.team_name as toss_winner,
    m.toss_choice,
    w.team_name as winner,
    m.win_margin
FROM matches m
LEFT JOIN match_stages ms ON m.id = ms.match_id
INNER JOIN teams t1 ON m.team1_id = t1.id
INNER JOIN teams t2 ON m.team2_id = t2.id
INNER JOIN teams tw ON m.toss_winner_id = tw.id
LEFT JOIN teams w ON m.winner_id = w.id
ORDER BY m.match_date DESC, ms.match_number DESC;
