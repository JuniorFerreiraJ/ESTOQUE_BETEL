/*
  # Add department controls and permissions

  1. Changes
    - Add department_id to inventory_history table
    - Add user_id to inventory_history table
    - Update policies for department-based access

  2. Security
    - Enable RLS for inventory_history
    - Add policies for department-based access control
*/

-- Add columns to inventory_history if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_history' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE inventory_history ADD COLUMN department_id uuid REFERENCES departments(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_history' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE inventory_history ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all users to read history" ON inventory_history;
DROP POLICY IF EXISTS "Allow authenticated users to insert history" ON inventory_history;
DROP POLICY IF EXISTS "Allow authenticated users to read history" ON inventory_history;
DROP POLICY IF EXISTS "Allow public read access" ON inventory_history;

-- Create new department-based policies
CREATE POLICY "Users can read history for their departments"
ON inventory_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND (ur.department_id = inventory_history.department_id OR ur.role = 'admin')
  )
);

CREATE POLICY "Users can insert history for their departments"
ON inventory_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND (ur.department_id = inventory_history.department_id OR ur.role = 'admin')
    AND ur.role = ANY (ARRAY['admin', 'manager'])
  )
);

CREATE POLICY "Users can update history observations for their departments"
ON inventory_history
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND (ur.department_id = inventory_history.department_id OR ur.role = 'admin')
    AND ur.role = ANY (ARRAY['admin', 'manager'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND (ur.department_id = inventory_history.department_id OR ur.role = 'admin')
    AND ur.role = ANY (ARRAY['admin', 'manager'])
  )
);

CREATE POLICY "Users can delete history for their departments"
ON inventory_history
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND (ur.department_id = inventory_history.department_id OR ur.role = 'admin')
    AND ur.role = ANY (ARRAY['admin', 'manager'])
  )
);

-- Enable RLS if not already enabled
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;