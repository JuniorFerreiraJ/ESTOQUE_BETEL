/*
  # Remove all authentication policies and simplify schema

  1. Changes
    - Drop all existing policies
    - Remove RLS from all tables
    - Clean up any remaining auth-related objects
*/

-- First, disable RLS on all tables to prevent policy conflicts
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all users to read history" ON inventory_history;
DROP POLICY IF EXISTS "Allow authenticated users to insert history" ON inventory_history;
DROP POLICY IF EXISTS "Allow authenticated users to read history" ON inventory_history;
DROP POLICY IF EXISTS "Allow public read access" ON inventory_history;
DROP POLICY IF EXISTS "Users can read history for their departments" ON inventory_history;
DROP POLICY IF EXISTS "Users can insert history for their departments" ON inventory_history;
DROP POLICY IF EXISTS "Users can update history observations for their departments" ON inventory_history;
DROP POLICY IF EXISTS "Users can delete history for their departments" ON inventory_history;
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to read departments" ON departments;
DROP POLICY IF EXISTS "Allow authenticated users to insert departments" ON departments;
DROP POLICY IF EXISTS "Allow authenticated users to read inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated users to update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete inventory items" ON inventory_items;

-- Drop any remaining auth-related objects
DROP MATERIALIZED VIEW IF EXISTS admin_users;
DROP FUNCTION IF EXISTS refresh_admin_users();
DROP TABLE IF EXISTS user_roles;

-- Remove auth-related columns
ALTER TABLE inventory_history DROP COLUMN IF EXISTS user_id;