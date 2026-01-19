/*
  # Fix RLS for chips, assets and devolucoes tables - Security Fix

  1. Changes
    - Enable RLS on chips, assets, asset_history, chip_history and devolucoes tables
    - Create policies that allow access ONLY to authenticated users
    - Block unauthenticated access (prevents PII and inventory data exposure)

  2. Security
    - Only authenticated users can access these tables
    - No access for anonymous/unauthenticated users
    - All authenticated users have full access (no department filtering needed for these tables)
*/

-- Enable RLS on chips and related tables
ALTER TABLE chips ENABLE ROW LEVEL SECURITY;
ALTER TABLE chip_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on assets and related tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on devolucoes table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'devolucoes') THEN
        ALTER TABLE devolucoes ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Also check for returns table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'returns') THEN
        ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop any existing policies on these tables
DROP POLICY IF EXISTS "Allow authenticated users to read chips" ON chips;
DROP POLICY IF EXISTS "Allow authenticated users to insert chips" ON chips;
DROP POLICY IF EXISTS "Allow authenticated users to update chips" ON chips;
DROP POLICY IF EXISTS "Allow authenticated users to delete chips" ON chips;
DROP POLICY IF EXISTS "Allow public access" ON chips;
DROP POLICY IF EXISTS "Allow anon access" ON chips;

DROP POLICY IF EXISTS "Allow authenticated users to read chip_history" ON chip_history;
DROP POLICY IF EXISTS "Allow authenticated users to insert chip_history" ON chip_history;
DROP POLICY IF EXISTS "Allow public access" ON chip_history;
DROP POLICY IF EXISTS "Allow anon access" ON chip_history;

DROP POLICY IF EXISTS "Allow authenticated users to read assets" ON assets;
DROP POLICY IF EXISTS "Allow authenticated users to insert assets" ON assets;
DROP POLICY IF EXISTS "Allow authenticated users to update assets" ON assets;
DROP POLICY IF EXISTS "Allow authenticated users to delete assets" ON assets;
DROP POLICY IF EXISTS "Allow public access" ON assets;
DROP POLICY IF EXISTS "Allow anon access" ON assets;

DROP POLICY IF EXISTS "Allow authenticated users to read asset_history" ON asset_history;
DROP POLICY IF EXISTS "Allow authenticated users to insert asset_history" ON asset_history;
DROP POLICY IF EXISTS "Allow public access" ON asset_history;
DROP POLICY IF EXISTS "Allow anon access" ON asset_history;

DROP POLICY IF EXISTS "Allow authenticated users to read devolucoes" ON devolucoes;
DROP POLICY IF EXISTS "Allow authenticated users to insert devolucoes" ON devolucoes;
DROP POLICY IF EXISTS "Allow authenticated users to update devolucoes" ON devolucoes;
DROP POLICY IF EXISTS "Allow authenticated users to delete devolucoes" ON devolucoes;
DROP POLICY IF EXISTS "Allow public access" ON devolucoes;
DROP POLICY IF EXISTS "Allow anon access" ON devolucoes;

DROP POLICY IF EXISTS "Allow authenticated users to read returns" ON returns;
DROP POLICY IF EXISTS "Allow authenticated users to insert returns" ON returns;
DROP POLICY IF EXISTS "Allow authenticated users to update returns" ON returns;
DROP POLICY IF EXISTS "Allow authenticated users to delete returns" ON returns;
DROP POLICY IF EXISTS "Allow public access" ON returns;
DROP POLICY IF EXISTS "Allow anon access" ON returns;

-- Create policies for chips table - ONLY authenticated users
CREATE POLICY "Allow authenticated users full access to chips"
ON chips
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for chip_history table - ONLY authenticated users
CREATE POLICY "Allow authenticated users full access to chip_history"
ON chip_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for assets table - ONLY authenticated users
CREATE POLICY "Allow authenticated users full access to assets"
ON assets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for asset_history table - ONLY authenticated users
CREATE POLICY "Allow authenticated users full access to asset_history"
ON asset_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for devolucoes table - ONLY authenticated users
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'devolucoes') THEN
        CREATE POLICY "Allow authenticated users full access to devolucoes"
        ON devolucoes
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
    
    -- Also create policy for returns table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'returns') THEN
        CREATE POLICY "Allow authenticated users full access to returns"
        ON returns
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Grant all permissions to authenticated users (for API access)
GRANT ALL ON chips TO authenticated;
GRANT ALL ON chip_history TO authenticated;
GRANT ALL ON assets TO authenticated;
GRANT ALL ON asset_history TO authenticated;

-- Grant permissions on devolucoes and returns if tables exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'devolucoes') THEN
        GRANT ALL ON devolucoes TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'returns') THEN
        GRANT ALL ON returns TO authenticated;
    END IF;
END $$;
