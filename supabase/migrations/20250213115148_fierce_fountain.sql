/*
  # Add departments and improve item organization

  1. New Tables
    - `departments`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)

  2. Changes
    - Add `department_id` to `inventory_items` table
    - Add foreign key constraint

  3. Security
    - Enable RLS on `departments` table
    - Add policies for authenticated users
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add department_id to inventory_items
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_items' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN department_id uuid REFERENCES departments(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert departments"
  ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default departments
INSERT INTO departments (name) VALUES
  ('TI'),
  ('ADMINISTRATIVO'),
  ('COMERCIAL'),
  ('OPERACIONAL')
ON CONFLICT (name) DO NOTHING;