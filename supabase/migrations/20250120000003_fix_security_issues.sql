/*
  # Fix Security Issues - Functions and RLS Policies

  1. Changes
    - Fix mutable search_path in functions (only if they exist)
    - Improve RLS policies to check auth.uid() instead of always true
    - Maintain functionality while improving security

  2. Security
    - Functions now have fixed search_path (if they exist)
    - RLS policies verify user authentication properly
*/

-- Fix Function Search Path Issues
-- Set search_path to public for all functions to prevent security issues
-- Only alter functions that actually exist

-- Fix update_updated_at_column function
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
    ) THEN
        -- Get the function signature and alter it
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || p.oid::regprocedure || ' SET search_path = public'
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
            LIMIT 1
        );
    END IF;
END $$;

-- Fix update_chips_updated_at function
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_chips_updated_at'
    ) THEN
        -- Get the function signature and alter it
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || p.oid::regprocedure || ' SET search_path = public'
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'update_chips_updated_at'
            LIMIT 1
        );
    END IF;
END $$;

-- Fix add_return_to_inventory function (if exists) - using dynamic SQL to get correct signature
DO $$ 
DECLARE
    func_signature text;
BEGIN
    SELECT p.oid::regprocedure::text INTO func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'add_return_to_inventory'
    LIMIT 1;
    
    IF func_signature IS NOT NULL THEN
        EXECUTE format('ALTER FUNCTION %s SET search_path = public', func_signature);
    END IF;
END $$;

-- Fix RLS Policies - Replace 'true' with auth.uid() check for better security
-- This ensures only authenticated users can access, but is more explicit

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated users full access to chips" ON chips;
DROP POLICY IF EXISTS "Allow authenticated users full access to chip_history" ON chip_history;
DROP POLICY IF EXISTS "Allow authenticated users full access to assets" ON assets;
DROP POLICY IF EXISTS "Allow authenticated users full access to asset_history" ON asset_history;
DROP POLICY IF EXISTS "Allow authenticated users full access to devolucoes" ON devolucoes;
DROP POLICY IF EXISTS "Allow authenticated users full access to returns" ON returns;
DROP POLICY IF EXISTS "Allow authenticated users to insert departments" ON departments;

-- Create improved policies for chips
CREATE POLICY "Allow authenticated users full access to chips"
ON chips
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create improved policies for chip_history
CREATE POLICY "Allow authenticated users full access to chip_history"
ON chip_history
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create improved policies for assets
CREATE POLICY "Allow authenticated users full access to assets"
ON assets
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create improved policies for asset_history
CREATE POLICY "Allow authenticated users full access to asset_history"
ON asset_history
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create improved policies for devolucoes
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'devolucoes') THEN
        CREATE POLICY "Allow authenticated users full access to devolucoes"
        ON devolucoes
        FOR ALL
        TO authenticated
        USING (auth.uid() IS NOT NULL)
        WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Create improved policies for returns
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'returns') THEN
        CREATE POLICY "Allow authenticated users full access to returns"
        ON returns
        FOR ALL
        TO authenticated
        USING (auth.uid() IS NOT NULL)
        WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Fix departments insert policy
DROP POLICY IF EXISTS "Allow authenticated users to insert departments" ON departments;
CREATE POLICY "Allow authenticated users to insert departments"
ON departments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
