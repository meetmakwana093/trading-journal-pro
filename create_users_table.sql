-- SQL script to create users table and add user_id to trades table
-- Run this on your MySQL hosting server to set up authentication schema

CREATE DATABASE IF NOT EXISTS trade_journal;
USE trade_journal;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id column to trades table if it doesn't exist
ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id INT;

-- Optional: Add foreign key constraint (uncomment if desired)
-- ALTER TABLE trades ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Index for user_id lookups
CREATE INDEX idx_user_id ON trades(user_id);

-- Verify table structures
SHOW COLUMNS FROM users;
SHOW COLUMNS FROM trades;