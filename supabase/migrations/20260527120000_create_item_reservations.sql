/*
  Create item_reservations table to persist reservation (preparação) data
*/

CREATE TABLE IF NOT EXISTS item_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  status text NOT NULL CHECK (status IN ('reserved','completed','cancelled')) DEFAULT 'reserved',
  reason text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE item_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read reservations" ON item_reservations;
CREATE POLICY "Allow authenticated users to read reservations"
  ON item_reservations
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert reservations" ON item_reservations;
CREATE POLICY "Allow authenticated users to insert reservations"
  ON item_reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update reservations" ON item_reservations;
CREATE POLICY "Allow authenticated users to update reservations"
  ON item_reservations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
