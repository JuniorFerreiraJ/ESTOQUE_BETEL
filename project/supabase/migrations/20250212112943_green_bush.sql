/*
  # Create inventory history table

  1. New Tables
    - `inventory_history`
      - `id` (uuid, primary key)
      - `item_name` (text)
      - `quantity_changed` (integer)
      - `type` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `inventory_history` table
    - Add policy for authenticated users to read history
    - Add policy for authenticated users to insert history
*/

CREATE TABLE IF NOT EXISTS inventory_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  quantity_changed integer NOT NULL,
  type text NOT NULL CHECK (type IN ('entrada', 'saída')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read history"
  ON inventory_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert history"
  ON inventory_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);