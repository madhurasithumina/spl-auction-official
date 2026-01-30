-- Matches Schema for Live Scoreboard
-- Run this SQL to create the required tables

-- Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_date DATE NOT NULL,
    team1_id INT NOT NULL,
    team2_id INT NOT NULL,
    total_overs INT NOT NULL DEFAULT 20,
    toss_winner_id INT NOT NULL,
    toss_choice ENUM('bat', 'bowl') NOT NULL,
    venue VARCHAR(255) DEFAULT 'SPL Stadium',
    status ENUM('setup', 'live', 'innings_break', 'completed') DEFAULT 'setup',
    current_innings INT DEFAULT 1,
    winner_id INT DEFAULT NULL,
    win_margin VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (toss_winner_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Playing XI Table
CREATE TABLE IF NOT EXISTS match_playing_xi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    team_id INT NOT NULL,
    player_id INT NOT NULL,
    batting_order INT DEFAULT NULL,
    is_captain BOOLEAN DEFAULT FALSE,
    is_wicketkeeper BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_match (match_id, player_id)
);

-- Innings Table
CREATE TABLE IF NOT EXISTS innings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    innings_number INT NOT NULL,
    batting_team_id INT NOT NULL,
    bowling_team_id INT NOT NULL,
    total_runs INT DEFAULT 0,
    total_wickets INT DEFAULT 0,
    total_overs DECIMAL(4,1) DEFAULT 0.0,
    total_balls INT DEFAULT 0,
    extras_wide INT DEFAULT 0,
    extras_noball INT DEFAULT 0,
    extras_bye INT DEFAULT 0,
    extras_legbye INT DEFAULT 0,
    extras_penalty INT DEFAULT 0,
    target INT DEFAULT NULL,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (batting_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (bowling_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_innings (match_id, innings_number)
);

-- Ball by Ball Table
CREATE TABLE IF NOT EXISTS ball_by_ball (
    id INT AUTO_INCREMENT PRIMARY KEY,
    innings_id INT NOT NULL,
    over_number INT NOT NULL,
    ball_number INT NOT NULL,
    batsman_id INT NOT NULL,
    non_striker_id INT NOT NULL,
    bowler_id INT NOT NULL,
    runs_scored INT DEFAULT 0,
    is_wide BOOLEAN DEFAULT FALSE,
    is_noball BOOLEAN DEFAULT FALSE,
    is_bye BOOLEAN DEFAULT FALSE,
    is_legbye BOOLEAN DEFAULT FALSE,
    is_wicket BOOLEAN DEFAULT FALSE,
    wicket_type ENUM('bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired_hurt', 'retired_out', 'obstructing_field', 'timed_out', 'handled_ball') DEFAULT NULL,
    wicket_player_id INT DEFAULT NULL,
    fielder_id INT DEFAULT NULL,
    is_boundary_four BOOLEAN DEFAULT FALSE,
    is_boundary_six BOOLEAN DEFAULT FALSE,
    is_legal_ball BOOLEAN DEFAULT TRUE,
    extra_runs INT DEFAULT 0,
    total_runs INT DEFAULT 0,
    is_penalty BOOLEAN DEFAULT FALSE,
    penalty_runs INT DEFAULT 0,
    commentary TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (innings_id) REFERENCES innings(id) ON DELETE CASCADE,
    FOREIGN KEY (batsman_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (non_striker_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (bowler_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Batsman Scorecard Table
CREATE TABLE IF NOT EXISTS batsman_scorecard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    innings_id INT NOT NULL,
    player_id INT NOT NULL,
    batting_position INT NOT NULL,
    runs_scored INT DEFAULT 0,
    balls_faced INT DEFAULT 0,
    fours INT DEFAULT 0,
    sixes INT DEFAULT 0,
    strike_rate DECIMAL(6,2) DEFAULT 0.00,
    dismissal_type ENUM('not_out', 'bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired_hurt', 'retired_out', 'obstructing_field', 'timed_out', 'handled_ball', 'did_not_bat') DEFAULT 'did_not_bat',
    dismissed_by INT DEFAULT NULL,
    fielder_id INT DEFAULT NULL,
    is_on_strike BOOLEAN DEFAULT FALSE,
    is_at_crease BOOLEAN DEFAULT FALSE,
    status ENUM('yet_to_bat', 'batting', 'out', 'retired') DEFAULT 'yet_to_bat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (innings_id) REFERENCES innings(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE KEY unique_batsman_innings (innings_id, player_id)
);

-- Bowler Scorecard Table
CREATE TABLE IF NOT EXISTS bowler_scorecard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    innings_id INT NOT NULL,
    player_id INT NOT NULL,
    overs_bowled DECIMAL(4,1) DEFAULT 0.0,
    balls_bowled INT DEFAULT 0,
    maidens INT DEFAULT 0,
    runs_conceded INT DEFAULT 0,
    wickets INT DEFAULT 0,
    economy DECIMAL(5,2) DEFAULT 0.00,
    wides INT DEFAULT 0,
    noballs INT DEFAULT 0,
    dot_balls INT DEFAULT 0,
    is_current_bowler BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (innings_id) REFERENCES innings(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bowler_innings (innings_id, player_id)
);

-- Current Match State (for quick lookups)
CREATE TABLE IF NOT EXISTS match_state (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL UNIQUE,
    current_innings_id INT DEFAULT NULL,
    striker_id INT DEFAULT NULL,
    non_striker_id INT DEFAULT NULL,
    current_bowler_id INT DEFAULT NULL,
    last_bowler_id INT DEFAULT NULL,
    current_over INT DEFAULT 0,
    current_ball INT DEFAULT 0,
    runs_this_over VARCHAR(50) DEFAULT '',
    need_new_bowler BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- Partnership Table
CREATE TABLE IF NOT EXISTS partnerships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    innings_id INT NOT NULL,
    wicket_number INT NOT NULL,
    batsman1_id INT NOT NULL,
    batsman2_id INT NOT NULL,
    total_runs INT DEFAULT 0,
    total_balls INT DEFAULT 0,
    batsman1_runs INT DEFAULT 0,
    batsman2_runs INT DEFAULT 0,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (innings_id) REFERENCES innings(id) ON DELETE CASCADE
);

-- Fall of Wickets Table
CREATE TABLE IF NOT EXISTS fall_of_wickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    innings_id INT NOT NULL,
    wicket_number INT NOT NULL,
    player_id INT NOT NULL,
    runs_at_fall INT NOT NULL,
    overs_at_fall DECIMAL(4,1) NOT NULL,
    FOREIGN KEY (innings_id) REFERENCES innings(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);
