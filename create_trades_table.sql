-- SQL script to create the trades table for MySQL
-- Run this on your MySQL hosting server to set up the database schema

CREATE DATABASE IF NOT EXISTS trade_journal;
USE trade_journal;

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(20) NOT NULL,
    entry_price DECIMAL(15,4) NOT NULL,
    exit_price DECIMAL(15,4),
    profit_loss DECIMAL(15,4),
    entry_time DATETIME NOT NULL,
    session VARCHAR(50),
    direction VARCHAR(20) NOT NULL,
    followed_plan TINYINT(1) DEFAULT 0,
    rating INT,
    mistakes TEXT,
    went_right TEXT,
    entry_window VARCHAR(50),
    model VARCHAR(100),
    positive_tags TEXT,
    negative_tags TEXT,
    account VARCHAR(50),
    be TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_entry_time ON trades(entry_time DESC);
CREATE INDEX idx_symbol ON trades(symbol);
CREATE INDEX idx_account ON trades(account);

-- Optional: Insert a sample record for testing (remove in production)
/*
INSERT INTO trades (symbol, entry_price, exit_price, profit_loss, entry_time, session, direction, followed_plan, rating, mistakes, went_right, entry_window, model, positive_tags, negative_tags, account, be)
VALUES ('AAPL', 150.00, 155.00, 5.00, NOW(), 'Morning', 'Long', 1, 5, 'None', 'Good timing', '9:30-10:00', 'Swing Trade', 'bullish,bearish', 'overtrading', '10000', 0);
*/

-- Verify table structure
DESCRIBE trades;