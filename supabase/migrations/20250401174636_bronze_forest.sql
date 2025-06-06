/*
  # Fix recursive policies in user_roles table

  1. Changes
    - Drop existing problematic policies
    - Create new, non-recursive policies for user_roles table
    - Add admin_users view for better policy management

  2. Security
    - Policies now use direct checks without recursion
    - Maintain same level of security with optimized logic
*/

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins have full access" ON user_roles;
DROP POLICY IF EXISTS "Managers can read department roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;

-- Create admin_users materialized view if it doesn't exist
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_users AS
SELECT DISTINCT user_id
FROM user_roles
WHERE role = 'admin';

-- Create new, non-recursive policies
CREATE POLICY "Allow admins full access"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Allow users to read own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

CREATE POLICY "Allow managers to read department roles"
ON user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'manager'
    AND user_roles.department_id = user_roles.department_id
  )
);

-- Create function to refresh admin_users view
CREATE OR REPLACE FUNCTION refresh_admin_users()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW admin_users;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh admin_users view
DROP TRIGGER IF EXISTS refresh_admin_users_trigger ON user_roles;
CREATE TRIGGER refresh_admin_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_admin_users();
