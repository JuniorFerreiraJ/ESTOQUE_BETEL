-- Add admin user to user_roles
INSERT INTO user_roles (user_id, role, department_id)
VALUES (
  '767a2ce2-de6d-480a-8836-62573d43a2ac',  -- ID do usuário admin
  'admin',
  (SELECT id FROM departments WHERE name = 'TI' LIMIT 1)
)
ON CONFLICT (user_id, role) 
DO NOTHING;

-- Refresh admin users view
REFRESH MATERIALIZED VIEW admin_users;

-- Ensure RLS is properly configured
ALTER TABLE inventory_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

-- Recreate policies with simpler rules
DROP POLICY IF EXISTS "Enable all operations" ON inventory_history;
CREATE POLICY "Enable all operations"
ON inventory_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON inventory_history TO authenticated;
GRANT ALL ON inventory_items TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON departments TO authenticated;
GRANT ALL ON categories TO authenticated; 