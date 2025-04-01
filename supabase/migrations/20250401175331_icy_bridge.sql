/*
  # Remove authentication and simplify permissions

  1. Changes
    - Drop user_roles table and related objects
    - Remove RLS policies
    - Simplify access control
*/

-- Drop user_roles related objects
DROP MATERIALIZED VIEW IF EXISTS admin_users;
DROP FUNCTION IF EXISTS refresh_admin_users();
DROP TABLE IF EXISTS user_roles;

-- Remove RLS from tables
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read history for their departments" ON inventory_history;
DROP POLICY IF EXISTS "Users can insert history for their departments" ON inventory_history;
DROP POLICY IF EXISTS "Users can update history observations for their departments" ON inventory_history;
DROP POLICY IF EXISTS "Users can delete history for their departments" ON inventory_history;

-- Remove user_id column from inventory_history
ALTER TABLE inventory_history DROP COLUMN IF EXISTS user_id;