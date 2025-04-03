-- Drop existing policies that might depend on admin_users
DROP POLICY IF EXISTS "Allow admins full access" ON user_roles;
DROP POLICY IF EXISTS "Allow admins to manage" ON user_roles;
DROP POLICY IF EXISTS "Allow admins to delete" ON user_roles;
DROP POLICY IF EXISTS "Allow admins to update" ON user_roles;
DROP POLICY IF EXISTS "Allow admins to insert" ON user_roles;

-- Drop materialized view with CASCADE to remove all dependencies
DROP MATERIALIZED VIEW IF EXISTS admin_users CASCADE;

-- Disable RLS on all tables
ALTER TABLE inventory_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable all operations" ON inventory_history;
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory_history;
DROP POLICY IF EXISTS "Enable insert for all users" ON inventory_history;
DROP POLICY IF EXISTS "Enable update for all users" ON inventory_history;
DROP POLICY IF EXISTS "Enable delete for all users" ON inventory_history;

-- Grant all permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure tables exist and have correct permissions
DO $$ 
BEGIN
    -- Ensure inventory_history table exists
    CREATE TABLE IF NOT EXISTS inventory_history (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        item_name text NOT NULL,
        quantity_changed integer NOT NULL,
        type text NOT NULL,
        observation text,
        department_id uuid REFERENCES departments(id),
        user_name text,
        created_at timestamp with time zone DEFAULT now()
    );
    
    -- Ensure inventory_items table exists
    CREATE TABLE IF NOT EXISTS inventory_items (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        name text NOT NULL,
        category_id uuid REFERENCES categories(id),
        department_id uuid REFERENCES departments(id),
        current_quantity integer DEFAULT 0,
        minimum_quantity integer DEFAULT 0,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
    );
    
    -- Grant explicit permissions
    GRANT ALL ON inventory_history TO authenticated;
    GRANT ALL ON inventory_items TO authenticated;
    GRANT ALL ON departments TO authenticated;
    GRANT ALL ON categories TO authenticated;
    GRANT ALL ON user_roles TO authenticated;
END $$; 