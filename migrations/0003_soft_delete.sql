-- Add is_deleted column to items and categories
ALTER TABLE items ADD COLUMN is_deleted INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN is_deleted INTEGER DEFAULT 0;
