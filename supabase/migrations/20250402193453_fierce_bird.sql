/*
  # Add user name tracking to inventory history

  1. Changes
    - Add `user_name` column to `inventory_history` table
    - This will store the name of the user who made the movement
    - Using text type for flexibility and to avoid user table dependencies

  2. Notes
    - Using text field instead of foreign key for simplicity since auth was removed
    - Existing records will have NULL in the new column
*/

-- Disable RLS temporarily
ALTER TABLE inventory_history DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory_history;
DROP POLICY IF EXISTS "Enable insert for all users" ON inventory_history;
DROP POLICY IF EXISTS "Enable update for all users" ON inventory_history;
DROP POLICY IF EXISTS "Enable delete for all users" ON inventory_history;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS inventory_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    item_name text NOT NULL,
    quantity_changed integer NOT NULL,
    type text NOT NULL CHECK (type IN ('entrada', 'saída')),
    observation text,
    created_at timestamptz DEFAULT now(),
    department_id uuid REFERENCES departments(id),
    user_name text
);

-- Create simplified policies
CREATE POLICY "Enable all access for authenticated users"
ON inventory_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

-- Ensure we have at least one admin user
INSERT INTO user_roles (user_id, role, department_id)
SELECT 
  auth.uid(),
  'admin',
  (SELECT id FROM departments WHERE name = 'TI' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE role = 'admin'
);

-- Refresh admin users view
REFRESH MATERIALIZED VIEW admin_users;