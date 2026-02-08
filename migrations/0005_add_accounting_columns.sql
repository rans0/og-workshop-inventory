-- Migration: Add accounting columns to transactions table
-- Run this first in Cloudflare D1 dashboard (both local & remote)

-- Add accounting columns to transactions table
ALTER TABLE transactions ADD COLUMN price REAL DEFAULT NULL;
ALTER TABLE transactions ADD COLUMN running_qty INTEGER DEFAULT NULL;
ALTER TABLE transactions ADD COLUMN running_value REAL DEFAULT NULL;
ALTER TABLE transactions ADD COLUMN avg_price REAL DEFAULT NULL;

-- Create price_changes table for audit trail (optional)
CREATE TABLE IF NOT EXISTS price_changes (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    old_price REAL NOT NULL,
    new_price REAL NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id)
);
